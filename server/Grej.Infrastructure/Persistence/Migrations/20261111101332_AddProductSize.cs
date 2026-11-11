using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Grej.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ItemDiameterCm",
                table: "Products",
                type: "numeric(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ItemHeightCm",
                table: "Products",
                type: "numeric(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ItemLengthCm",
                table: "Products",
                type: "numeric(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ItemWeightGrams",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ItemWidthCm",
                table: "Products",
                type: "numeric(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemDiameterCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ItemHeightCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ItemLengthCm",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ItemWeightGrams",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ItemWidthCm",
                table: "Products");
        }
    }
}
