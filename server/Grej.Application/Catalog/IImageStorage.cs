namespace Grej.Application.Catalog;

// Where product images are stored. Implemented in Infrastructure with Supabase
// Storage (SupabaseImageStorage). The database only stores the address.
public interface IImageStorage
{
    // Uploads the file to path and returns the public URL the browser loads it from.
    Task<string> UploadAsync(string path, ImageFile image, CancellationToken cancellationToken);

    // Never throws if the storage cannot delete the file. By then nothing points to it,
    // so it is only an unused file.
    Task DeleteAsync(string path, CancellationToken cancellationToken);
}
