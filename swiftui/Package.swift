// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MultiTimer",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "MultiTimer",
            targets: ["MultiTimer"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "MultiTimer",
            dependencies: [],
            path: "MultiTimer"
        )
    ]
)
