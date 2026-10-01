import AppKit
import Foundation

// Deterministic platform exports: preserve the original pixels inside the tile.
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = NSImage(contentsOf: root.appendingPathComponent("assets/branding/piggypath-original.png"))!
var proposed = CGRect(origin: .zero, size: source.size)
let original = source.cgImage(forProposedRect: &proposed, context: nil, hints: nil)!
let colorSpace = CGColorSpaceCreateDeviceRGB()
func context(_ size: Int, opaque: Bool = false) -> CGContext {
    CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4,
              space: colorSpace, bitmapInfo: (opaque ? CGImageAlphaInfo.noneSkipLast : CGImageAlphaInfo.premultipliedLast).rawValue)!
}
func save(_ image: CGImage, _ path: String) throws {
    let url = root.appendingPathComponent(path)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    let data = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
    try data.write(to: url)
}
let masterContext = context(1254)
let tileRect = CGRect(x: 64, y: 64, width: 1126, height: 1126)
masterContext.addPath(CGPath(roundedRect: tileRect, cornerWidth: 232, cornerHeight: 232, transform: nil))
masterContext.clip()
masterContext.draw(original, in: CGRect(x: 0, y: 0, width: 1254, height: 1254))
let master = masterContext.makeImage()!.cropping(to: tileRect)!
try save(master, "assets/branding/piggypath-master.png")
func render(_ size: Int, opaque: Bool = false, fraction: Double = 1, circle: Bool = false) -> CGImage {
    let ctx = context(size, opaque: opaque)
    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    if circle {
        ctx.addEllipse(in: rect); ctx.clip()
    }
    if opaque || circle {
        ctx.setFillColor(CGColor(red: 246 / 255.0, green: 60 / 255.0, blue: 126 / 255.0, alpha: 1))
        ctx.fill(rect)
    }
    let side = Double(size) * fraction
    let inset = (Double(size) - side) / 2
    ctx.interpolationQuality = .high
    ctx.draw(master, in: CGRect(x: inset, y: inset, width: side, height: side))
    return ctx.makeImage()!
}
try save(render(576), "assets/branding/piggypath-logo.png")
try save(render(1024, opaque: true), "assets/branding/piggypath-icon.png")
for (density, scale) in [("mdpi", 1.0), ("hdpi", 1.5), ("xhdpi", 2.0), ("xxhdpi", 3.0), ("xxxhdpi", 4.0)] {
    let directory = "android/app/src/main/res/mipmap-\(density)"
    try save(render(Int(48 * scale)), "\(directory)/ic_launcher.png")
    try save(render(Int(48 * scale), fraction: 0.82, circle: true), "\(directory)/ic_launcher_round.png")
    // Keep the rounded tile inside adaptive launcher's 66 dp safe circle.
    try save(render(Int(108 * scale), fraction: 56.0 / 108.0), "\(directory)/ic_launcher_foreground.png")
}
let catalog = "ios/PiggyPath/Images.xcassets/AppIcon.appiconset"
let catalogURL = root.appendingPathComponent("\(catalog)/Contents.json")
var json = try JSONSerialization.jsonObject(with: Data(contentsOf: catalogURL)) as! [String: Any]
var entries = json["images"] as! [[String: String]]
for index in entries.indices {
    let entry = entries[index]
    let points = Double(entry["size"]!.split(separator: "x")[0])!
    let scale = Double(entry["scale"]!.dropLast())!
    let pixels = Int(points * scale)
    let file = "icon-\(pixels).png"
    try save(render(pixels, opaque: true), "\(catalog)/\(file)")
    entries[index]["filename"] = file
}
json["images"] = entries
try JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted, .sortedKeys]).write(to: catalogURL)
print("Exported clean master, in-app logo, Android density/adaptive icons, and opaque iOS icons.")
