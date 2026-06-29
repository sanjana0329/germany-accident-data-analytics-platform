import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import QueryLab from "./pages/QueryLab";
import FilterPage from "./pages/FilterPage";
import Analytics from "./pages/Analytics";
import DataSources from "./pages/DataSources";
import StateComparison from "./pages/StateComparison";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/query-lab"
          element={<QueryLab />}
        />

        <Route
          path="/filter"
          element={<FilterPage />}
        />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/data-sources" element={<DataSources />} />
        <Route path="/comparison" element={<StateComparison />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;