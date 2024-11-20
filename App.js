import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function App() {
  const [col1, setCol1] = useState('');
  const [excelData1, setExcelData1] = useState(null);
  const [excelData2, setExcelData2] = useState(null);

  // Função para processar o arquivo Excel
  const processExcel = (file, setData) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const abuf = e.target.result;
      const wb = XLSX.read(abuf, { type: 'array' });

      // Pegando a primeira planilha
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Lê como um array de arrays

      // Encontrando o índice da linha "Nome" e a primeira linha NaN
      const nomeIndex = data.findIndex(row => row[3] === 'Nome');
      if (nomeIndex === -1) return alert('Esse não é o excel de classificação de um torneio em português!');

      const firstNaNIndex = data.slice(nomeIndex).findIndex(row => row[3] === undefined || row[3] === null);
      const firstNanAfterNome = nomeIndex + firstNaNIndex;

      // Carregar dados relevantes após o "Nome" e antes do primeiro NaN
      const relevantData = data.slice(nomeIndex , firstNanAfterNome - 1);

      // Criar um DataFrame similar ao Python
      const df = relevantData.map(row => ({
        'Clube/Cidade': row[7], // Adaptar conforme a estrutura das suas colunas
        'Pts.': row[8], // Adaptar conforme necessário (coluna de pontos)
      }));

      // Aplicando a lógica para selecionar as primeiras 5 entradas por "Clube/Cidade"
      const grouped = {};
      const filteredData = [];

      df.forEach((row) => {
        const club = row['Clube/Cidade'].toUpperCase(); // Converte para maiúsculo
        if (!grouped[club]) {
          grouped[club] = 0;
        }
        if (grouped[club] < 5) {
          filteredData.push({ ...row, 'Clube/Cidade': club });
          grouped[club]++;
        }
      });

      // Atualiza o estado com os dados filtrados
      setData(filteredData);
    };

    reader.readAsArrayBuffer(file);
  };

  // Função para tratar o upload do primeiro arquivo
  const handleFileUpload1 = (e) => {
    const file = e.target.files[0];
    if (file) {
      processExcel(file, setExcelData1);
    }
  };

  // Função para tratar o upload do segundo arquivo
  const handleFileUpload2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      processExcel(file, setExcelData2);
    }
  };

  // Função para gerar o Excel a partir dos dados processados
  const handleCreateExcel = () => {
    if (excelData1 && excelData2) {
      // Fazendo o append (concatenação) dos dados do segundo arquivo ao primeiro
      const combinedData = [...excelData1, ...excelData2];

      // Filtrar 'Pts.' != 'Nº.Inic.'
      const filteredData = combinedData.filter(row => row['Pts.'] !== 'Nº.Inic.');

      // Transformar a coluna 'Pts.' para numérica
      const numericData = filteredData.map(row => ({
        ...row,
        'Pts.': parseFloat(row['Pts.']) || 0, // Garantir que valores não numéricos sejam tratados como 0
      }));

      // Agregar os dados por 'Clube/Cidade' somando os 'Pts.'
      const aggregatedData = numericData.reduce((acc, row) => {
        const { 'Clube/Cidade': club, 'Pts.': points } = row;
        if (!acc[club]) {
          acc[club] = 0;
        }
        acc[club] += points;
        return acc;
      }, {});

      // Converter os dados agregados para o formato final
      const finalData = Object.entries(aggregatedData).map(([key, value]) => ({
        'Clube/Cidade': key,
        'Pts.': value,
      }));

      // Ordenar os dados por 'Pts.' em ordem decrescente
      const sortedData = finalData.sort((a, b) => b['Pts.'] - a['Pts.']);

      // Gerar o arquivo Excel com os dados ordenados
      const worksheet = XLSX.utils.json_to_sheet(sortedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, 'output_aggregated_sorted.xlsx');
    } else {
      alert('Por favor, faça o upload dos dois arquivos Excel.');
    }
  };

  return (
  <div style={{ padding: '20px', fontFamily: 'Roboto, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
      Calculadora de Pontos Por Equipe do Circuito Pernambucano de Xadrez Escolar
    </h1>

    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFileUpload1}
      style={{
        display: 'block',
        marginBottom: '15px',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #DDDDDD',
        width: '100%',
        maxWidth: '400px',
        fontSize: '16px',
      }}
    />

    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFileUpload2}
      style={{
        display: 'block',
        marginBottom: '20px',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #DDDDDD',
        width: '100%',
        maxWidth: '400px',
        fontSize: '16px',
      }}
    />

    <button
      onClick={handleCreateExcel}
      style={{
        padding: '12px 20px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = '#2563eb')}
      onMouseOut={(e) => (e.target.style.backgroundColor = '#3b82f6')}
    >
      Calcular e Baixar Excel
    </button>
  </div>
);

}


export default App;