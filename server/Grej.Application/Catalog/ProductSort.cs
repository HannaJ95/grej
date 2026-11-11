namespace Grej.Application.Catalog;

// The order of a product list, e.g. ?sort=priceAscending. Only the CMS offers Oldest.
public enum ProductSort
{
    Newest,
    PriceAscending,
    PriceDescending,
    Oldest,
}
