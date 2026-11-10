using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Grej.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderIsOversold : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOversold",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOversold",
                table: "Orders");
        }
    }
}
