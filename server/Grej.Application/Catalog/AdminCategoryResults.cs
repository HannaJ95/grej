namespace Grej.Application.Catalog;

// How AdminCategoryService.DeleteAsync ended.
public enum DeleteCategoryResult
{
    Deleted,
    NotFound,
    // Products must always have a category, so they must be moved first (ambiguity.md).
    HasProducts,
}
