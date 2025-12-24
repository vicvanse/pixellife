"""
Análise de Leaving-Rate Matching
Script para análise de dados de experimentos de escolha
Autor: Análise de Dados Comportamentais
Data: 2025
"""

import os
import re
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from pathlib import Path
from scipy import stats
from typing import Dict, List, Tuple, Optional

# Configuração de estilo
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 8)
plt.rcParams['font.size'] = 12


def parse_filename(filename: str) -> Optional[Dict[str, str]]:
    """
    Extrai informações do nome do arquivo seguindo o padrão:
    Tipo__P{id}_C{cond}_S{sess}_O{opt}.txt
    """
    pattern = r'([SF])__P(\d+)_C(\d+)_S(\d+)_O(\d+)\.txt'
    match = re.match(pattern, filename)
    
    if match:
        return {
            'type': match.group(1),  # 'S' ou 'F'
            'participant': match.group(2),
            'condition': match.group(3),
            'session': match.group(4),
            'option': match.group(5),
            'filename': filename
        }
    return None


def find_data_files(directory: str = '.') -> Tuple[List[str], List[str]]:
    """
    Encontra todos os arquivos .txt na pasta atual e subpastas.
    Retorna tupla: (arquivos_S, arquivos_F)
    """
    saccade_files = []
    fixation_files = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.txt'):
                file_info = parse_filename(file)
                if file_info:
                    full_path = os.path.join(root, file)
                    if file_info['type'] == 'S':
                        saccade_files.append(full_path)
                    elif file_info['type'] == 'F':
                        fixation_files.append(full_path)
    
    return saccade_files, fixation_files


def process_saccade_file(filepath: str) -> Optional[Dict]:
    """
    Processa arquivo de Saccades (CENÁRIO A).
    Calcula lambda e proporção observada baseado em runs.
    """
    try:
        df = pd.read_csv(filepath, sep='\t', encoding='utf-8')
        
        # Verifica se a coluna LADO existe
        if 'LADO' not in df.columns:
            print(f"Aviso: Coluna 'LADO' não encontrada em {filepath}")
            return None
        
        # Remove valores NaN
        df = df[df['LADO'].notna()]
        
        if len(df) == 0:
            print(f"Aviso: Nenhum dado válido em {filepath}")
            return None
        
        # Identifica runs (sequências consecutivas do mesmo lado)
        df['run_id'] = (df['LADO'] != df['LADO'].shift()).cumsum()
        
        # Calcula tamanho de cada run
        run_lengths = df.groupby('run_id')['LADO'].count()
        
        # Separa runs por lado
        runs_side1 = []
        runs_side2 = []
        
        for run_id, length in run_lengths.items():
            lado = df[df['run_id'] == run_id]['LADO'].iloc[0]
            if lado == 1:
                runs_side1.append(length)
            elif lado == 2:
                runs_side2.append(length)
        
        # Calcula lambda (taxa de saída) = 1 / média de trials por run
        if len(runs_side1) > 0:
            lambda_1 = 1.0 / np.mean(runs_side1)
        else:
            lambda_1 = np.nan
        
        if len(runs_side2) > 0:
            lambda_2 = 1.0 / np.mean(runs_side2)
        else:
            lambda_2 = np.nan
        
        # Calcula proporção observada
        total_trials_side1 = len(df[df['LADO'] == 1])
        total_trials = len(df)
        observed_prop_1 = total_trials_side1 / total_trials if total_trials > 0 else np.nan
        
        # Extrai informações do nome do arquivo
        file_info = parse_filename(os.path.basename(filepath))
        
        return {
            'Participant': file_info['participant'],
            'Condition': file_info['condition'],
            'Session': file_info['session'],
            'Lambda_1': lambda_1,
            'Lambda_2': lambda_2,
            'Observed_Prop_1': observed_prop_1,
            'Type': 'Saccades'
        }
    
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return None


def process_fixation_file(filepath: str) -> Optional[Dict]:
    """
    Processa arquivo de Fixações (CENÁRIO B).
    Calcula lambda e proporção observada baseado em visitas (fixações consecutivas).
    """
    try:
        df = pd.read_csv(filepath, sep='\t', encoding='utf-8')
        
        # Verifica se as colunas necessárias existem
        required_cols = ['CURRENT_FIX_INTEREST_AREA_LABEL', 'CURRENT_FIX_DURATION']
        if not all(col in df.columns for col in required_cols):
            print(f"Aviso: Colunas necessárias não encontradas em {filepath}")
            return None
        
        # Remove valores NaN
        df = df[df['CURRENT_FIX_INTEREST_AREA_LABEL'].notna()]
        df = df[df['CURRENT_FIX_DURATION'].notna()]
        
        if len(df) == 0:
            print(f"Aviso: Nenhum dado válido em {filepath}")
            return None
        
        # Filtra apenas áreas de interesse relevantes (LeftSample e RightSample/Right_Sample)
        # Aceita variações: 'LeftSample', 'RightSample', 'Right_Sample'
        valid_areas = ['LeftSample', 'RightSample', 'Right_Sample']
        df = df[df['CURRENT_FIX_INTEREST_AREA_LABEL'].isin(valid_areas)]
        
        # Normaliza nomes: Right_Sample -> RightSample
        df = df.copy()
        df['CURRENT_FIX_INTEREST_AREA_LABEL'] = df['CURRENT_FIX_INTEREST_AREA_LABEL'].replace('Right_Sample', 'RightSample')
        
        if len(df) == 0:
            print(f"Aviso: Nenhuma fixação em áreas de interesse em {filepath}")
            return None
        
        # Identifica visitas (sequências consecutivas na mesma área)
        df['visit_id'] = (df['CURRENT_FIX_INTEREST_AREA_LABEL'] != 
                         df['CURRENT_FIX_INTEREST_AREA_LABEL'].shift()).cumsum()
        
        # Calcula duração de cada visita (soma das durações consecutivas)
        visit_durations = df.groupby('visit_id').agg({
            'CURRENT_FIX_DURATION': 'sum',
            'CURRENT_FIX_INTEREST_AREA_LABEL': 'first'
        })
        
        # Converte duração de ms para segundos
        visit_durations['duration_seconds'] = visit_durations['CURRENT_FIX_DURATION'] / 1000.0
        
        # Separa visitas por lado (já normalizado)
        visits_side1 = visit_durations[
            visit_durations['CURRENT_FIX_INTEREST_AREA_LABEL'] == 'LeftSample'
        ]['duration_seconds'].values
        
        visits_side2 = visit_durations[
            visit_durations['CURRENT_FIX_INTEREST_AREA_LABEL'] == 'RightSample'
        ]['duration_seconds'].values
        
        # Calcula lambda (taxa de saída) = 1 / tempo médio da visita
        if len(visits_side1) > 0:
            lambda_1 = 1.0 / np.mean(visits_side1)
        else:
            lambda_1 = np.nan
        
        if len(visits_side2) > 0:
            lambda_2 = 1.0 / np.mean(visits_side2)
        else:
            lambda_2 = np.nan
        
        # Calcula proporção observada (tempo total em cada lado)
        total_time_side1 = visit_durations[
            visit_durations['CURRENT_FIX_INTEREST_AREA_LABEL'] == 'LeftSample'
        ]['duration_seconds'].sum()
        
        total_time = visit_durations['duration_seconds'].sum()
        observed_prop_1 = total_time_side1 / total_time if total_time > 0 else np.nan
        
        # Extrai informações do nome do arquivo
        file_info = parse_filename(os.path.basename(filepath))
        
        return {
            'Participant': file_info['participant'],
            'Condition': file_info['condition'],
            'Session': file_info['session'],
            'Lambda_1': lambda_1,
            'Lambda_2': lambda_2,
            'Observed_Prop_1': observed_prop_1,
            'Type': 'Fixations'
        }
    
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return None


def calculate_predicted_proportion(lambda_1: float, lambda_2: float) -> float:
    """
    Calcula a proporção predita pelo Leaving-Matching (Eq. 2 de Avellaneda, 2025):
    Pred_1 = lambda_2 / (lambda_1 + lambda_2)
    """
    if np.isnan(lambda_1) or np.isnan(lambda_2) or (lambda_1 + lambda_2) == 0:
        return np.nan
    return lambda_2 / (lambda_1 + lambda_2)


def main():
    """
    Função principal: orquestra todo o processo de análise.
    """
    try:
        print("=" * 60)
        print("Análise de Leaving-Rate Matching")
        print("=" * 60)
        print()
    except Exception as e:
        import sys
        sys.stderr.write(f"Erro ao iniciar: {e}\n")
        return
    
    # 1. Detectar arquivos
    print("1. Detectando arquivos de dados...")
    saccade_files, fixation_files = find_data_files('.')
    
    print(f"   Arquivos de Saccades encontrados: {len(saccade_files)}")
    print(f"   Arquivos de Fixações encontrados: {len(fixation_files)}")
    print()
    
    # 2. Processar arquivos
    results = []
    
    # Processa arquivos de Saccades (CENÁRIO A)
    if len(saccade_files) > 0:
        print("2. Processando arquivos de Saccades...")
        for filepath in saccade_files:
            result = process_saccade_file(filepath)
            if result:
                results.append(result)
        print(f"   Processados: {len([r for r in results if r['Type'] == 'Saccades'])} arquivos")
        print()
    
    # Processa arquivos de Fixações (CENÁRIO B)
    if len(fixation_files) > 0:
        print("3. Processando arquivos de Fixações...")
        for filepath in fixation_files:
            result = process_fixation_file(filepath)
            if result:
                results.append(result)
        print(f"   Processados: {len([r for r in results if r['Type'] == 'Fixations'])} arquivos")
        print()
    
    if len(results) == 0:
        print("ERRO: Nenhum arquivo foi processado com sucesso!")
        return
    
    # 3. Criar DataFrame Mestre
    print("4. Consolidando resultados...")
    df_results = pd.DataFrame(results)
    
    # Calcula proporção predita
    df_results['Predicted_Prop_1'] = df_results.apply(
        lambda row: calculate_predicted_proportion(row['Lambda_1'], row['Lambda_2']),
        axis=1
    )
    
    # Remove linhas com valores NaN críticos
    df_results = df_results[
        df_results[['Lambda_1', 'Lambda_2', 'Observed_Prop_1', 'Predicted_Prop_1']].notna().all(axis=1)
    ]
    
    print(f"   Total de sessões processadas: {len(df_results)}")
    print()
    
    # 5. Estatísticas descritivas
    print("5. Estatísticas Descritivas:")
    print("-" * 60)
    print(df_results.groupby('Type')[['Lambda_1', 'Lambda_2', 'Observed_Prop_1', 'Predicted_Prop_1']].describe())
    print()
    
    # 6. Análise de regressão
    print("6. Análise de Regressão:")
    print("-" * 60)
    
    for data_type in df_results['Type'].unique():
        df_subset = df_results[df_results['Type'] == data_type]
        
        if len(df_subset) < 2:
            continue
        
        # Remove outliers extremos se necessário
        x = df_subset['Predicted_Prop_1'].values
        y = df_subset['Observed_Prop_1'].values
        
        # Regressão linear
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        print(f"\n{data_type}:")
        print(f"  R² = {r_value**2:.4f}")
        print(f"  Inclinação = {slope:.4f}")
        print(f"  Intercepto = {intercept:.4f}")
        print(f"  p-value = {p_value:.4e}")
        print(f"  N = {len(df_subset)}")
    
    print()
    
    # 7. Visualização
    print("7. Gerando visualizações...")
    
    # 7a. Gráfico original (proporções)
    # Cria figura com subplots se houver múltiplos tipos
    if len(df_results['Type'].unique()) > 1:
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        axes = axes.flatten()
    else:
        fig, ax = plt.subplots(1, 1, figsize=(10, 8))
        axes = [ax]
    
    for idx, data_type in enumerate(sorted(df_results['Type'].unique())):
        df_subset = df_results[df_results['Type'] == data_type]
        ax = axes[idx] if len(axes) > 1 else axes[0]
        
        # Scatter plot
        if 'Condition' in df_subset.columns and df_subset['Condition'].nunique() > 1:
            sns.scatterplot(
                data=df_subset,
                x='Predicted_Prop_1',
                y='Observed_Prop_1',
                hue='Condition',
                s=100,
                alpha=0.7,
                ax=ax
            )
        else:
            sns.scatterplot(
                data=df_subset,
                x='Predicted_Prop_1',
                y='Observed_Prop_1',
                s=100,
                alpha=0.7,
                ax=ax
            )
        
        # Linha de identidade (y=x)
        min_val = min(df_subset['Predicted_Prop_1'].min(), df_subset['Observed_Prop_1'].min())
        max_val = max(df_subset['Predicted_Prop_1'].max(), df_subset['Observed_Prop_1'].max())
        ax.plot([min_val, max_val], [min_val, max_val], 'r--', 
                linewidth=2, label='Matching Perfeito (y=x)', alpha=0.7)
        
        # Linha de regressão
        if len(df_subset) >= 2:
            x_reg = df_subset['Predicted_Prop_1'].values
            y_reg = df_subset['Observed_Prop_1'].values
            slope, intercept, r_value, _, _ = stats.linregress(x_reg, y_reg)
            x_line = np.linspace(min_val, max_val, 100)
            y_line = slope * x_line + intercept
            ax.plot(x_line, y_line, 'b-', linewidth=2, 
                   label=f'Regressão (R²={r_value**2:.3f})', alpha=0.7)
        
        ax.set_xlabel('Proporção Predita (λ2/(λ1+λ2))', fontsize=12)
        ax.set_ylabel('Proporção Observada', fontsize=12)
        ax.set_title(f'Leaving-Rate Matching: {data_type}', fontsize=14, fontweight='bold')
        ax.legend(loc='best')
        ax.grid(True, alpha=0.3)
        ax.set_aspect('equal', adjustable='box')
    
    plt.tight_layout()
    plt.savefig('leaving_matching_analysis.png', dpi=300, bbox_inches='tight')
    print("   Gráfico salvo como: leaving_matching_analysis.png")
    print()
    
    # 7b. Gráfico Log-Log por Participante (Matching-Law Style)
    print("7b. Gerando gráficos log-log por participante (Matching-Law)...")
    
    # Separa dados de Saccades e Fixations
    df_saccades = df_results[df_results['Type'] == 'Saccades'].copy()
    df_fixations = df_results[df_results['Type'] == 'Fixations'].copy()
    
    # Calcula valores relativos: RELATIVE = 2*prop - 1 (normaliza entre -1 e 1)
    df_saccades['Relative_Trials'] = 2 * df_saccades['Observed_Prop_1'] - 1
    df_fixations['Relative_Fixation'] = 2 * df_fixations['Observed_Prop_1'] - 1
    
    # Merge por Participant, Condition, Session
    df_merged = pd.merge(
        df_saccades[['Participant', 'Condition', 'Session', 'Relative_Trials']],
        df_fixations[['Participant', 'Condition', 'Session', 'Relative_Fixation']],
        on=['Participant', 'Condition', 'Session'],
        how='inner'
    )
    
    if len(df_merged) > 0:
        # Cria figura 2x2 para os 4 participantes
        fig, axes = plt.subplots(2, 2, figsize=(12, 12))
        axes = axes.flatten()
        
        participants = sorted(df_merged['Participant'].unique())
        
        for idx, participant in enumerate(participants):
            if idx >= 4:  # Limita a 4 participantes
                break
            
            ax = axes[idx]
            df_participant = df_merged[df_merged['Participant'] == participant].copy()
            
            # Usa valores relativos diretamente (como na imagem)
            x_vals = df_participant['Relative_Trials'].values
            y_vals = df_participant['Relative_Fixation'].values
            
            if len(x_vals) > 0:
                # Para matching-law log-log, transforma valores relativos em razões
                # Valores relativos: -1 a 1
                # Para log-log, usamos razões: ratio = (1+rel)/(1-rel) quando rel != ±1
                # Isso transforma [-1, 1] em [0, +inf], permitindo log-log
                
                epsilon = 1e-4
                x_ratios = []
                y_ratios = []
                
                for i in range(len(x_vals)):
                    rel_trials = x_vals[i]
                    rel_fix = y_vals[i]
                    
                    # Evita valores extremos que causam problemas no log
                    if abs(rel_trials) < 0.999 and abs(rel_fix) < 0.999:
                        # Calcula razão: (1+rel)/(1-rel)
                        ratio_trials = (1 + rel_trials + epsilon) / (1 - rel_trials + epsilon)
                        ratio_fix = (1 + rel_fix + epsilon) / (1 - rel_fix + epsilon)
                        
                        x_ratios.append(ratio_trials)
                        y_ratios.append(ratio_fix)
                
                if len(x_ratios) > 0:
                    x_ratios = np.array(x_ratios)
                    y_ratios = np.array(y_ratios)
                    
                    # Aplica log10 para escala log-log (típico de matching-law)
                    log_x = np.log10(x_ratios)
                    log_y = np.log10(y_ratios)
                    
                    # Scatter plot com pontos pretos sólidos (como na imagem)
                    ax.scatter(log_x, log_y, s=150, alpha=0.9, color='black', 
                              edgecolors='none', zorder=3, linewidth=0)
                    
                    # Linha de identidade (y=x) - linha tracejada
                    log_min = min(log_x.min(), log_y.min())
                    log_max = max(log_x.max(), log_y.max())
                    margin = (log_max - log_min) * 0.1 if (log_max - log_min) > 0 else 0.5
                    ax.plot([log_min - margin, log_max + margin], 
                           [log_min - margin, log_max + margin], 
                           'k--', linewidth=2, alpha=0.6, dashes=(5, 5), zorder=2)
                    
                    # Configuração de eixos
                    ax.set_xlabel('RELATIVE TRIALS', fontsize=12, fontweight='bold')
                    ax.set_ylabel('RELATIVE FIXATION', fontsize=12, fontweight='bold')
                    ax.set_title(f'P{participant}', fontsize=14, fontweight='bold', pad=10)
                    
                    # Grid sutil
                    ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.5)
                    ax.set_aspect('equal', adjustable='box')
            else:
                ax.text(0.5, 0.5, 'Dados insuficientes', 
                       ha='center', va='center', transform=ax.transAxes, fontsize=12)
                ax.set_title(f'P{participant}', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('leaving_matching_loglog_by_participant.png', dpi=300, bbox_inches='tight')
        print("   Gráfico log-log salvo como: leaving_matching_loglog_by_participant.png")
        print()
    else:
        print("   Aviso: Não foi possível criar gráfico log-log (dados insuficientes para merge)")
        print()
    
    # 8. Salvar resultados
    output_file = 'leaving_matching_results.csv'
    df_results.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"8. Resultados salvos em: {output_file}")
    print()
    
    print("=" * 60)
    print("Análise concluída com sucesso!")
    print("=" * 60)


if __name__ == '__main__':
    main()

