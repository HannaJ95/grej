using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// The CMS's colors. Every endpoint is in AdminPropertiesController.
[Route("api/admin/colors")]
public class AdminColorsController(AdminPropertyService<Color> colors)
    : AdminPropertiesController<Color>(colors)
{
}
