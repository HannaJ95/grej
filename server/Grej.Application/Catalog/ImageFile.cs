namespace Grej.Application.Catalog;

// An uploaded file that is known to be a jpg, png or webp image of at most 5 MB
// (constraints.md). FromBytes is the only way to create one, so a file that breaks
// the rules can never reach the storage.
public class ImageFile
{
    public const int MaxBytes = 5 * 1024 * 1024;

    // Every jpg and png file starts with these bytes (the format's "signature").
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public byte[] Content { get; }

    // E.g. "image/png". Sent to the storage, which serves the file with it.
    public string ContentType { get; }

    // E.g. ".png". Used in the file's name in the storage.
    public string Extension { get; }

    private ImageFile(byte[] content, string contentType, string extension)
    {
        Content = content;
        ContentType = contentType;
        Extension = extension;
    }

    // Null if the file is larger than 5 MB or is not a jpg, png or webp image.
    public static ImageFile? FromBytes(byte[] content)
    {
        if (content.Length > MaxBytes)
        {
            return null;
        }

        // The file's name and type are chosen by the browser and can say anything, so
        // the format is read from the first bytes of the file instead.
        var bytes = content.AsSpan();
        if (bytes.StartsWith(JpegSignature))
        {
            return new ImageFile(content, "image/jpeg", ".jpg");
        }
        if (bytes.StartsWith(PngSignature))
        {
            return new ImageFile(content, "image/png", ".png");
        }
        // "RIFF", four bytes with the file's size, then "WEBP".
        if (bytes.Length >= 12 && bytes.StartsWith("RIFF"u8) && bytes[8..12].SequenceEqual("WEBP"u8))
        {
            return new ImageFile(content, "image/webp", ".webp");
        }

        return null;
    }
}
