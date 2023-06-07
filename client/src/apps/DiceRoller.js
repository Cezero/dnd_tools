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
      <div className="message">
        {data ? <p>{data.evaluated}</p> : null}
        {data ? <p>{data.roll}</p> : null}
      </div>
    </div>
  );
};

export default DiceRoller;