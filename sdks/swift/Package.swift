// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Nexora",
    platforms: [.macOS(.v12), .iOS(.v15)],
    products: [
        .library(name: "Nexora", targets: ["Nexora"]),
    ],
    targets: [
        .target(name: "Nexora", dependencies: []),
    ]
)
