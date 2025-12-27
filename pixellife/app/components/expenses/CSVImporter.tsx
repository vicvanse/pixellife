'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Array<{
    description: string;
    value: number;
    date: string;
    category?: string;
  }>) => void;
}

// Função para adivinhar categoria baseado no nome
function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('uber') || n.includes('99') || n.includes('taxi') || n.includes('transporte')) return 'Transporte';
  if (n.includes('ifood') || n.includes('restaurante') || n.includes('comida') || n.includes('mcdonald') || n.includes('burger')) return 'Alimentação';
  if (n.includes('netflix') || n.includes('spotify') || n.includes('streaming') || n.includes('cinema')) return 'Lazer';
  if (n.includes('farmacia') || n.includes('drogaria') || n.includes('medico') || n.includes('hospital')) return 'Saúde';
  if (n.includes('supermercado') || n.includes('atacadao') || n.includes('carrefour') || n.includes('extra')) return 'Compras';
  if (n.includes('gasolina') || n.includes('combustivel') || n.includes('posto')) return 'Transporte';
  if (n.includes('energia') || n.includes('luz') || n.includes('agua') || n.includes('agua') || n.includes('internet') || n.includes('telefone')) return 'Contas';
  if (n.includes('salario') || n.includes('pagamento') || n.includes('recebimento')) return 'Receita';
  return 'Geral';
}

// Função para normalizar dados de diferentes bancos
function normalizeTransaction(row: any): {
  description: string;
  value: number;
  date: string;
  category: string;
} | null {
  // Tentar encontrar valor em várias colunas possíveis
  const valorStr = row.amount || row.valor || row.Value || row.value || row['Valor'] || row['Amount'];
  const dataStr = row.date || row.data || row.Date || row['Data'] || row['Date'] || row.data_transacao;
  const descStr = row.title || row.historico || row.Description || row.descricao || row['Descrição'] || row['Description'] || row.desc || row.nome;

  if (!valorStr || !dataStr || !descStr) {
    return null;
  }

  // Converter valor para número
  let valor = parseFloat(String(valorStr).replace(/[^\d,.-]/g, '').replace(',', '.'));
  if (isNaN(valor)) return null;

  // Converter data
  let data: Date;
  try {
    // Tentar diferentes formatos de data
    if (dataStr.includes('/')) {
      const [dia, mes, ano] = dataStr.split('/');
      data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    } else if (dataStr.includes('-')) {
      data = new Date(dataStr);
    } else {
      data = new Date(dataStr);
    }
    
    if (isNaN(data.getTime())) return null;
  } catch {
    return null;
  }

  // Formatar data como YYYY-MM-DD
  const dateFormatted = data.toISOString().split('T')[0];
  
  // Adivinhar categoria
  const category = guessCategory(descStr);

  return {
    description: String(descStr).trim(),
    value: valor,
    date: dateFormatted,
    category,
  };
}

export function CSVImporter({ isOpen, onClose, onImport }: CSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    // Verificar se é CSV
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          try {
            const transactions: Array<{
              description: string;
              value: number;
              date: string;
              category?: string;
            }> = [];

            results.data.forEach((row: any) => {
              const normalized = normalizeTransaction(row);
              if (normalized) {
                transactions.push(normalized);
              }
            });

            if (transactions.length === 0) {
              setError('Nenhuma transação válida encontrada no arquivo. Verifique o formato.');
              setIsProcessing(false);
              return;
            }

            onImport(transactions);
            setIsProcessing(false);
            onClose();
          } catch (err) {
            setError('Erro ao processar arquivo. Verifique se o formato está correto.');
            setIsProcessing(false);
          }
        },
        error: (error) => {
          setError(`Erro ao ler arquivo: ${error.message}`);
          setIsProcessing(false);
        },
      });
    } else if (file.name.endsWith('.ofx')) {
      // OFX será implementado depois se necessário
      setError('Formato OFX ainda não suportado. Por favor, exporte como CSV.');
      setIsProcessing(false);
    } else {
      setError('Formato de arquivo não suportado. Use CSV.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 rounded-lg"
        style={{
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
            Importar Extrato (CSV)
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div
            className="p-8 border-2 border-dashed rounded-lg text-center"
            style={{
              borderColor: '#9e9e9e',
              backgroundColor: '#f7f7f7',
            }}
          >
            <p className="font-pixel mb-4" style={{ color: '#333', fontSize: '14px' }}>
              Arraste seu extrato CSV aqui ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-block px-4 py-2 rounded font-pixel cursor-pointer transition-colors"
              style={{
                backgroundColor: isProcessing ? '#ccc' : '#9e9e9e',
                color: '#FFFFFF',
                fontSize: '14px',
              }}
            >
              {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
            </label>
          </div>

          {error && (
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
              }}
            >
              <p className="font-pixel text-sm">{error}</p>
            </div>
          )}

          <div className="text-xs font-pixel" style={{ color: '#666' }}>
            <p className="mb-2"><strong>Como exportar:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Nubank: Menu → Extrato → Exportar</li>
              <li>Inter: Extrato → Exportar CSV</li>
              <li>Itaú: Extrato → Exportar</li>
            </ul>
            <p className="mt-2">As categorias serão adivinhadas automaticamente!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

