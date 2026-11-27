using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaProSaude.API.Migrations
{
    /// <inheritdoc />
    public partial class VinculoProfissionalProcedimentoEContato : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Convenio",
                table: "Agendamentos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NumeroCarteirinha",
                table: "Agendamentos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PacienteTelefone",
                table: "Agendamentos",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProfissionalProcedimentos",
                columns: table => new
                {
                    ProfissionalId = table.Column<int>(type: "integer", nullable: false),
                    ProcedimentoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfissionalProcedimentos", x => new { x.ProfissionalId, x.ProcedimentoId });
                    table.ForeignKey(
                        name: "FK_ProfissionalProcedimentos_Procedimentos_ProcedimentoId",
                        column: x => x.ProcedimentoId,
                        principalTable: "Procedimentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProfissionalProcedimentos_Profissionais_ProfissionalId",
                        column: x => x.ProfissionalId,
                        principalTable: "Profissionais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProfissionalProcedimentos_ProcedimentoId",
                table: "ProfissionalProcedimentos",
                column: "ProcedimentoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProfissionalProcedimentos");

            migrationBuilder.DropColumn(
                name: "Convenio",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "NumeroCarteirinha",
                table: "Agendamentos");

            migrationBuilder.DropColumn(
                name: "PacienteTelefone",
                table: "Agendamentos");
        }
    }
}
