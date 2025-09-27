import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'

const prisma = new PrismaClient()

async function main() {
  const filePath = 'Rol - Procedimentos.xlsx'
  const workbook = xlsx.readFile(filePath)

  const categorias = [
    { sheet: 'Sem Auditoria', nome: 'SEM_AUDITORIA' },
    { sheet: 'Auditoria', nome: 'AUDITORIA' },
    { sheet: 'OPME', nome: 'OPME' },
  ]

  // Garante que as categorias existam
  for (const { nome } of categorias) {
    await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }

  for (const { sheet, nome } of categorias) {
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet])

    console.log(`➡ Importando ${sheetData.length} registros da aba ${sheet}`)

    for (const row of sheetData) {
      if (!row['Código'] || row['Código'] === '---') continue

      // Cria/pega o grupo
      let grupoId: number | null = null
      if (row['GRUPO'] && row['GRUPO'] !== '---') {
        const grupo = await prisma.grupo.upsert({
          where: { nome: String(row['GRUPO']).trim() },
          update: {},
          create: { nome: String(row['GRUPO']).trim() },
        })
        grupoId = grupo.id
      }

      // Cria/pega o subgrupo
      let subgrupoId: number | null = null
      if (row['SUBGRUPO'] && row['SUBGRUPO'] !== '---') {
        const subgrupo = await prisma.subgrupo.upsert({
          where: { nome: String(row['SUBGRUPO']).trim() },
          update: {},
          create: {
            nome: String(row['SUBGRUPO']).trim(),
            grupo: grupoId ? { connect: { id: grupoId } } : undefined,
          },
        })
        subgrupoId = subgrupo.id
      }

      // Cria/pega o capítulo
      let capituloId: number | null = null
      if (row['CAPÍTULO'] && row['CAPÍTULO'] !== '---') {
        const capitulo = await prisma.capitulo.upsert({
          where: { nome: String(row['CAPÍTULO']).trim() },
          update: {},
          create: { nome: String(row['CAPÍTULO']).trim() },
        })
        capituloId = capitulo.id
      }

      // Cria o procedimento
      const procedimento = await prisma.procedimento.create({
        data: {
          codigo: String(row['Código']).trim(),
          terminologia: String(row['Terminologia de Procedimentos e Eventos em Saúde (Tab. 22)'] || '').trim(),
          procedimento: String(row['PROCEDIMENTO'] || '').trim(),
          correlacao: row['Correlação\n(Sim/Não)'] === 'SIM',
          resolucao: row['Resolução\nNormativa (alteração)'] ? String(row['Resolução\nNormativa (alteração)']) : null,
          vigencia: row['VIGÊNCIA'] ? String(row['VIGÊNCIA']) : null,
          categoria: { connect: { nome } },
          grupoId,
          subgrupoId,
          capituloId,
        },
      })

      // Insere características (OD, AMB, HCO, HSO, PAC, DUT)
      const caracteristicas = ['OD', 'AMB', 'HCO', 'HSO', 'PAC', 'DUT']
      for (const tipo of caracteristicas) {
        if (row[tipo] && row[tipo] !== '---') {
          await prisma.caracteristica.create({
            data: {
              tipo,
              valor: String(row[tipo]),
              procedimentoId: procedimento.id,
            },
          })
        }
      }
    }
  }
}

main()
  .then(() => console.log('✅ Importação concluída!'))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })