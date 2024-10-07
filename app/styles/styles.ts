import { ViewStyle, TextStyle } from "react-native";

interface Styles {
  container: ViewStyle;
  scrollContainer: ViewStyle;
  title: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  compareButton: ViewStyle;
  result: TextStyle;
  tableContainer: ViewStyle;
  tableBorder: ViewStyle;
  head: ViewStyle;
  text: TextStyle;
  row: ViewStyle;
  exportButton: ViewStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
}

export const styles: Styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  compareButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  result: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
  },
  tableContainer: {
    marginTop: 20,
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: "#ddd",
  },
  head: {
    height: 40,
    backgroundColor: "#f1f8ff",
  },
  text: {
    margin: 6,
    textAlign: "center",
  },
  row: {
    height: 30,
    backgroundColor: "#fff",
  },
  exportButton: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  toggleButton: {
    backgroundColor: "#ffc107",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
};
