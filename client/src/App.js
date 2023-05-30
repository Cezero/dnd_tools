import React from "react";
import "./App.css";
import { Route, Routes } from "react-router";
import DiceRoller from "./apps/DiceRoller";
import InitiativeTracker from "./apps/InitiativeTracker";
import Home from "./components/Home";
import NavBar from "./components/NavBar";

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/DiceRoller" element={<DiceRoller />} />
        <Route path="/InitiativeTracker" element={<InitiativeTracker />} />
      </Routes>
    </div>
  );
}

export default App;