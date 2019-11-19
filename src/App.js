import React from 'react';
import MetaBalls from './metaballs'

function App() {
  return (
    <div className="App">
      <MetaBalls 
        childContainerFlex={"row-reverse"} /* container is flex you can decide the position of your content with flexdirection properties */
        innerContainer={<div style={{ width: "60rem", maxWidth: "100%", height: "100%"}} />} 
        shiftColor={{ min: 10, max: 60 }} 
        deflectMovement={{ min: 1, max: 5 }}
      >
        <div className="contentDiv">LET US BULLY YOUR GPU :)</div>
      </MetaBalls>
    </div>
  );
}

export default App;
