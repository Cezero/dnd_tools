import React from "react";

import {displayRollBreakdown} from "../inc/displayRollBreakdown";

function DiceRoller() {
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
      let dataString = "";
      if (res.status === 200) {
        let dieResult = JSON.parse(resJson);
        let breakdown = displayRollBreakdown({ "rollData": dieResult, "original": rollString });
        console.log("result: ", dieResult.evaluated);
        console.log("breakdown: ", breakdown);
        dataString = "<table style={{width: '100%', borderCollapse: 'collapse', border: '3px solid #333'}}><tbody style={{width: '100%'}} className=\"roll-table\">";
        dataString += <tr className="roll-table-dark-band"><td className="roll-table-roll-data">{breakdown}</td><td className="roll-table-roll-evaluated">{dieResult.evaluated}</td></tr>;
        dataString += "</tbody></table>";
      } else {
        dataString = <p>Some error occured</p>;
      };
      setData(dataString);
    } catch (err) {
      console.log(err);
    };
  };

  return (
    <div className="DiceRoller">
      <p>Enter dice to be rolled using standard notation (3d6, 1d20+4, 4d6k3, etc)</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={rollString}
          placeholder="Roll Description"
          onChange={(e) => setRollString(e.target.value)}
        />
        <button type="submit">Roll</button>
      </form>
      <div className="message">{data ? <div>{data}</div> : null}</div>
    </div>
  );
};

export default DiceRoller;