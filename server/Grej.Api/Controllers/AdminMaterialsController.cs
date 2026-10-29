using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// The CMS's materials. Every endpoint is in AdminPropertiesController.
[Route("api/admin/materials")]
public class AdminMaterialsController(AdminPropertyService<Material> materials)
    : AdminPropertiesController<Material>(materials)
{
}
