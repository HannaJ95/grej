using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

[Route("api/colors")]
public class ColorsController(PropertyService<Color> colors)
    : PropertiesController<Color>(colors)
{
}
