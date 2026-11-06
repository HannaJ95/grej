namespace Grej.Application.Catalog;

// How AdminCategoryService.UpdateAsync ended.
public enum UpdateCategoryResult
{
    Updated,
    NotFound,
    // The chosen main category is not allowed (only one level, ambiguity.md).
    InvalidParent,
}

// How AdminCategoryService.DeleteAsync ended.
public enum DeleteCategoryResult
{
    Deleted,
    NotFound,
    // Products must always have a category, so they must be moved first (ambiguity.md).
    HasProducts,
    // The subcategories must be deleted first (ambiguity.md).
    HasSubcategories,
}
