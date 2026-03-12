import CoreMedia
import UIKit
import VideoToolbox

/// Hardware-accelerated HEVC (H.265) decoder using VTDecompressionSession.
/// Used when streaming with `.hvc1` codec — the SDK delivers compressed
/// CMSampleBuffers that need decoding before display.
final class HEVCDecoder {
    private let logger = EMWDATLogger.shared
    private var decompressionSession: VTDecompressionSession?
    private var lastFormatDescription: CMFormatDescription?

    deinit {
        invalidate()
    }

    /// Decode a compressed HEVC CMSampleBuffer into a UIImage.
    /// Returns nil if decoding fails.
    func decode(_ sampleBuffer: CMSampleBuffer) -> UIImage? {
        guard CMSampleBufferIsValid(sampleBuffer) else {
            logger.warn("HEVCDecoder", "Invalid sample buffer")
            return nil
        }

        guard let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer) else {
            logger.warn("HEVCDecoder", "No format description")
            return nil
        }

        // Recreate session if format changed (resolution switch, etc.)
        if lastFormatDescription == nil || !CMFormatDescriptionEqual(formatDescription, otherFormatDescription: lastFormatDescription!) {
            createSession(formatDescription: formatDescription)
        }

        guard let session = decompressionSession else {
            logger.warn("HEVCDecoder", "No decompression session")
            return nil
        }

        var outputImage: UIImage?
        var flagOut: VTDecodeInfoFlags = []

        let status = VTDecompressionSessionDecodeFrame(
            session,
            sampleBuffer: sampleBuffer,
            flags: [._EnableAsynchronousDecompression],
            infoFlagsOut: &flagOut
        ) { status, _, imageBuffer, _, _ in
            guard status == noErr, let pixelBuffer = imageBuffer else {
                return
            }
            outputImage = Self.imageFromPixelBuffer(pixelBuffer)
        }

        if status != noErr {
            logger.warn("HEVCDecoder", "Decode failed", context: ["status": status])
            return nil
        }

        // Wait for synchronous completion
        VTDecompressionSessionWaitForAsynchronousFrames(session)

        return outputImage
    }

    /// Tear down the decompression session.
    func invalidate() {
        if let session = decompressionSession {
            VTDecompressionSessionInvalidate(session)
        }
        decompressionSession = nil
        lastFormatDescription = nil
    }

    // MARK: - Private

    private func createSession(formatDescription: CMFormatDescription) {
        invalidate()

        let decoderSpecification: CFDictionary? = nil
        let imageBufferAttributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]

        var session: VTDecompressionSession?
        let status = VTDecompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            formatDescription: formatDescription,
            decoderSpecification: decoderSpecification,
            imageBufferAttributes: imageBufferAttributes as CFDictionary,
            outputCallback: nil,
            decompressionSessionOut: &session
        )

        if status == noErr, let session = session {
            decompressionSession = session
            lastFormatDescription = formatDescription
            logger.info("HEVCDecoder", "Session created")
        } else {
            logger.error("HEVCDecoder", "Failed to create session", context: ["status": status])
        }
    }

    private static func imageFromPixelBuffer(_ pixelBuffer: CVPixelBuffer) -> UIImage? {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
            return nil
        }
        return UIImage(cgImage: cgImage)
    }
}
