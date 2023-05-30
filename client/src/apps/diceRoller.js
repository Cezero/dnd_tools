import React from "react";
import './App.css';

function App() {
  const [data, setData] = React.useState(null);
  const [rollString, setRollString] = React.useState(null);

  let handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res = await fetch("/api/dice/roll", {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
          dieDescription: rollString,
        }),
      });
      let resJson = await res.json();
      if (res.status === 200) {
        setData(resJson);
      } else {
        setData("Some error occured");
      };
    } catch (err) {
      console.log(err);
    };
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={rollString}
          placeholder="Roll Description"
          onChange={(e) => setRollString(e.target.value)}
        />
        <button type="submit">Roll</button>
      <div className="message">{data ? <p>{data}</p> : null}</div>
      </form>
    </div>
  );
};

export default App;
