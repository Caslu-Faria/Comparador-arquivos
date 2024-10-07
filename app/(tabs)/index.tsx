import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Papa from "papaparse";
import { Table, Row, Rows } from "react-native-table-component";
import { styles } from "@/app/styles/styles";

const App = () => {
  const [file1, setFile1] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  );
  const [file2, setFile2] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  );
  const [result, setResult] = useState<string | null>(null);
  const [differences, setDifferences] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Todos os dados incluindo a coluna "Diferença"
  const [tableHead, setTableHead] = useState<string[]>([]); // Cabeçalho da tabela
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false); // Alternar entre todas as linhas e apenas diferenças

  // Função para selecionar arquivos CSV
  const selectFile = async (
    setFile: React.Dispatch<
      React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>
    >
  ) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled) {
        Alert.alert("Cancelado", "Nenhum arquivo foi selecionado.");
      } else {
        const file = res.assets ? res.assets[0] : null;
        if (file) {
          setFile(file);
        }
      }
    } catch (err) {
      console.error("Erro ao selecionar arquivo:", err);
    }
  };

  // Função para comparar arquivos CSV
  const compareFiles = async () => {
    if (file1 && file2) {
      try {
        const data1 = await parseCSV(file1.uri);
        const data2 = await parseCSV(file2.uri);

        if (!data1.length || !data2.length) {
          Alert.alert("Erro", "Os arquivos CSV não possuem dados.");
          return;
        }

        const headers = Object.keys(data1[0]);
        setTableHead([...headers, "Diferença"]);

        const combinedData: any[] = [];
        const diffs: any[] = [];

        data1.forEach((row: any, index: number) => {
          const isDifferent =
            JSON.stringify(row) !== JSON.stringify(data2[index]);
          const combinedRow = {
            ...row,
            ...data2[index],
            Diferença: isDifferent ? "Sim" : "Não",
          };

          combinedData.push(Object.values(combinedRow)); // Valores de cada linha
          if (isDifferent) {
            diffs.push(Object.values(combinedRow)); // Guardar apenas as diferenças
          }
        });

        setDifferences(diffs);
        setAllData(combinedData);

        setResult(
          diffs.length > 0
            ? `Diferenças encontradas (${diffs.length}).`
            : "Os arquivos são idênticos."
        );
      } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Ocorreu um erro ao processar os arquivos.");
      }
    } else {
      Alert.alert("Atenção", "Por favor, selecione ambos os arquivos.");
    }
  };

  // Função para ler o CSV
  const parseCSV = async (fileUri: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      fetch(fileUri)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            Papa.parse(reader.result as string, {
              header: true,
              complete: (result: any) => {
                resolve(result.data);
              },
              error: (error: Error) => {
                reject(error);
              },
            });
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsText(blob);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // Função para salvar o arquivo CSV no dispositivo
  async function saveFile(uri: string, filename: string, mimetype: string) {
    if (Platform.OS === "android") {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const utf8 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          mimetype
        )
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, utf8, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          })
          .catch((e) => console.log(e));
      } else {
        Sharing.shareAsync(uri);
      }
    } else {
      Sharing.shareAsync(uri);
    }
  }

  // Função para exportar CSV
  const exportCSV = async (includeAll: boolean) => {
    const csvData = includeAll
      ? allData.map((row) => ({ ...row }))
      : differences.map((diff) => ({
          ...diff.file1,
          ...diff.file2,
          Diferença: "Sim",
        }));

    const csvString = Papa.unparse(csvData);
    const fileName = includeAll ? "todas_informacoes.csv" : "diferencas.csv";

    if (Platform.OS === "web") {
      // Para web: usar Blob e criar um link de download
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Para Android/iOS: usar FileSystem
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      try {
        await FileSystem.writeAsStringAsync(fileUri, csvString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        saveFile(fileUri, fileName, "text/csv");
        Alert.alert("Sucesso", `Arquivo CSV salvo em: ${fileUri}`);
      } catch (err) {
        console.error("Erro ao salvar CSV:", err);
        Alert.alert("Erro", "Falha ao salvar o arquivo CSV.");
      }
    }
  };

  // Função para compartilhar o arquivo CSV
  const shareCSV = async (includeAll: boolean) => {
    const csvData = includeAll
      ? allData
      : differences.map((diff) => ({ ...diff }));

    const csvString = Papa.unparse(csvData);
    const fileName = includeAll ? "todas_informacoes.csv" : "diferencas.csv";
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Erro",
          "Compartilhamento não está disponível no dispositivo."
        );
        return;
      }

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.error("Erro ao compartilhar CSV:", err);
      Alert.alert("Erro", "Falha ao compartilhar o arquivo CSV.");
    }
  };

  // Função para alternar entre visualizar todas as informações ou apenas as diferenças
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  const toggleView = () => {
    setShowDifferencesOnly((prev) => !prev);
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Comparador de Arquivos CSV</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => selectFile(setFile1)}
        >
          <Text style={styles.buttonText}>
            {file1 && file1.uri
              ? `Primeiro arquivo: ${file1.name}`
              : "Selecione o primeiro arquivo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => selectFile(setFile2)}
        >
          <Text style={styles.buttonText}>
            {file2 && file2.uri
              ? `Segundo arquivo: ${file2.name}`
              : "Selecione o segundo arquivo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.compareButton} onPress={compareFiles}>
          <Text style={styles.buttonText}>Comparar Arquivos</Text>
        </TouchableOpacity>

        {result && <Text style={styles.result}>{result}</Text>}

        {allData.length > 0 && (
          <View>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleView}>
              <Text style={styles.buttonText}>
                {showDifferencesOnly
                  ? "Exibir Todos os Dados"
                  : "Exibir Apenas Diferenças"}
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.tableContainer}>
              <Table borderStyle={styles.tableBorder}>
                <Row
                  data={tableHead}
                  style={styles.head}
                  textStyle={styles.text}
                />
                <Rows
                  data={showDifferencesOnly ? differences : allData}
                  style={styles.row}
                  textStyle={styles.text}
                />
              </Table>
            </ScrollView>
          </View>
        )}

        {differences.length > 0 && (
          <View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportCSV(false)}
            >
              <Text style={styles.buttonText}>Exportar Apenas Diferenças</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportCSV(true)}
            >
              <Text style={styles.buttonText}>
                Exportar Todas as Informações
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => shareCSV(false)}
            >
              <Text style={styles.buttonText}>
                Compartilhar Apenas Diferenças
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => shareCSV(true)}
            >
              <Text style={styles.buttonText}>
                Compartilhar Todas as Informações
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default App;
