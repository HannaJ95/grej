using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

[Route("api/materials")]
public class MaterialsController(PropertyService<Material> materials)
    : PropertiesController<Material>(materials)
{
}
