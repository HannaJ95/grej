using System.Text;
using Grej.Application.Catalog;

namespace Grej.UnitTests.Catalog;

// The files are written as text to make them easy to read. Latin1 turns each character
// into one byte, so "\xFF" becomes the byte 0xFF. Only the first bytes matter to ImageFile.
public class ImageFileTests
{
    private const string PngStart = "\x89PNG\r\n\x1A\n";

    [Theory]
    [InlineData("\xFF\xD8\xFF\xE0", "image/jpeg", ".jpg")]
    [InlineData(PngStart, "image/png", ".png")]
    // "RIFF", the file's size in four bytes, "WEBP".
    [InlineData("RIFF\x24\0\0\0WEBPVP8 ", "image/webp", ".webp")]
    public void FromBytes_AllowedFormat_ReadsTheFormatFromTheContent(string file, string contentType, string extension)
    {
        var image = ImageFile.FromBytes(Encoding.Latin1.GetBytes(file));

        Assert.Equal(contentType, image?.ContentType);
        Assert.Equal(extension, image?.Extension);
    }

    [Theory]
    [InlineData("GIF89a")]
    [InlineData("Hej, jag är en bild!")]
    // A wav file is also a RIFF file, but not WEBP.
    [InlineData("RIFF\x24\0\0\0WAVEfmt ")]
    [InlineData("")]
    public void FromBytes_OtherContent_ReturnsNull(string file)
    {
        Assert.Null(ImageFile.FromBytes(Encoding.Latin1.GetBytes(file)));
    }

    [Theory]
    [InlineData(ImageFile.MaxBytes, true)]
    [InlineData(ImageFile.MaxBytes + 1, false)]
    public void FromBytes_AtMost5MB(int size, bool allowed)
    {
        var content = new byte[size];
        Encoding.Latin1.GetBytes(PngStart).CopyTo(content, 0);

        Assert.Equal(allowed, ImageFile.FromBytes(content) is not null);
    }
}
