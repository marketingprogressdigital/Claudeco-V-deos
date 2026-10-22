// DESIGN PRO · visão local com o framework Vision do macOS (nada sai do computador, nenhum modelo é baixado).
// Uso:
//   visao recorte <entrada> <saida.png>   máscara de sujeito em primeiro plano → PNG com alfa (macOS 14+)
//   visao rosto <imagem>                  JSON com os rostos detectados (caixas em pixels, origem no topo)
//   visao ocr <imagem>                    JSON com os textos reconhecidos e a confiança
import AppKit
import CoreImage
import Foundation
import Vision

func sair(_ msg: String) -> Never {
  FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
  exit(1)
}

func carregar(_ caminho: String) -> CGImage {
  guard let img = NSImage(contentsOfFile: caminho), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    sair("não abri a imagem: \(caminho)")
  }
  return cg
}

func json(_ obj: Any) {
  let d = try! JSONSerialization.data(withJSONObject: obj, options: [.sortedKeys])
  print(String(data: d, encoding: .utf8)!)
}

let args = CommandLine.arguments
guard args.count >= 3 else { sair("uso: visao recorte|rosto|ocr <imagem> [saida]") }
let modo = args[1]
let cg = carregar(args[2])
let W = cg.width, H = cg.height
let handler = VNImageRequestHandler(cgImage: cg, options: [:])

switch modo {
case "recorte":
  guard args.count >= 4 else { sair("informe a saída") }
  if #available(macOS 14.0, *) {
    let req = VNGenerateForegroundInstanceMaskRequest()
    do { try handler.perform([req]) } catch { sair("falha no Vision: \(error)") }
    guard let obs = req.results?.first else { sair("nenhum sujeito em primeiro plano encontrado") }
    do {
      // Sujeito do retrato: une as instâncias com centro na coluna central (30% a 70% da largura) e área acima de 1%;
      // se nenhuma se encaixar, usa a de maior área. Objetos laterais do fundo ficam de fora.
      var escolhidas = IndexSet()
      var maior = (obs.allInstances.first!, -1.0)
      var total = 0.0
      var dados: [(Int, Double, Double)] = []
      for i in obs.allInstances {
        let m = try obs.generateScaledMaskForImage(forInstances: IndexSet(integer: i), from: handler)
        CVPixelBufferLockBaseAddress(m, .readOnly)
        let w = CVPixelBufferGetWidth(m), h = CVPixelBufferGetHeight(m), bpr = CVPixelBufferGetBytesPerRow(m)
        let base = CVPixelBufferGetBaseAddress(m)!.assumingMemoryBound(to: Float32.self)
        var area = 0.0, sx = 0.0
        for y in stride(from: 0, to: h, by: 4) {
          for x in stride(from: 0, to: w, by: 4) {
            let v = Double(base[y * (bpr / 4) + x])
            area += v
            sx += v * Double(x) / Double(w)
          }
        }
        total = Double((w / 4) * (h / 4))
        CVPixelBufferUnlockBaseAddress(m, .readOnly)
        dados.append((i, area, area > 0 ? sx / area : 0))
        if area > maior.1 { maior = (i, area) }
      }
      for (i, area, cx) in dados where cx > 0.3 && cx < 0.7 && area / total > 0.01 { escolhidas.insert(i) }
      if escolhidas.isEmpty { escolhidas.insert(maior.0) }
      let escolhido = Array(escolhidas)
      let buf = try obs.generateMaskedImage(ofInstances: escolhidas, from: handler, croppedToInstancesExtent: false)
      let ci = CIImage(cvPixelBuffer: buf)
      let ctx = CIContext()
      guard let out = ctx.createCGImage(ci, from: ci.extent) else { sair("falha ao gerar a imagem recortada") }
      let rep = NSBitmapImageRep(cgImage: out)
      guard let png = rep.representation(using: .png, properties: [:]) else { sair("falha ao gravar PNG") }
      try png.write(to: URL(fileURLWithPath: args[3]))
      json(["ok": true, "largura": out.width, "altura": out.height, "instancias": obs.allInstances.count, "escolhida": escolhido])
    } catch { sair("falha ao aplicar a máscara: \(error)") }
  } else {
    sair("recorte local exige macOS 14 ou mais novo")
  }
case "rosto":
  let req = VNDetectFaceRectanglesRequest()
  do { try handler.perform([req]) } catch { sair("falha no Vision: \(error)") }
  let rostos = (req.results ?? []).map { r -> [String: Double] in
    let b = r.boundingBox
    return ["x": Double(b.minX) * Double(W), "y": (1 - Double(b.maxY)) * Double(H), "w": Double(b.width) * Double(W), "h": Double(b.height) * Double(H), "confianca": Double(r.confidence)]
  }
  json(["largura": W, "altura": H, "rostos": rostos])
case "ocr":
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = false
  do { try handler.perform([req]) } catch { sair("falha no Vision: \(error)") }
  let textos = (req.results ?? []).compactMap { o -> [String: Any]? in
    guard let c = o.topCandidates(1).first else { return nil }
    return ["texto": c.string, "confianca": Double(c.confidence)]
  }
  json(["textos": textos])
default:
  sair("modo desconhecido: \(modo)")
}
