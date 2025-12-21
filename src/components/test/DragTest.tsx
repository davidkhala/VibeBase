import { useState } from "react";

/**
 * Simplest drag test component
 * Used to verify if browser drag functionality works properly
 */
export default function DragTest() {
  const [message, setMessage] = useState("Waiting for drag...");

  const handleDragStart = (e: React.DragEvent) => {
    console.log("✅ Test component: Drag started");
    setMessage("Dragging...");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "test");
  };

  const handleDragEnd = () => {
    console.log("✅ Test component: Drag ended");
    setMessage("Drag ended");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log("✅ Test component: Drag over target");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log("✅ Test component: Drop complete");
    setMessage("Drop successful!");
  };

  return (
    <div style={{ padding: "20px", border: "2px solid #666" }}>
      <h3>Drag Test</h3>
      <p>Status: {message}</p>

      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: "200px",
          padding: "20px",
          margin: "10px 0",
          backgroundColor: "#4CAF50",
          color: "white",
          cursor: "move",
          userSelect: "none",
        }}
      >
        Drag me
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: "200px",
          height: "100px",
          padding: "20px",
          margin: "10px 0",
          border: "2px dashed #ccc",
          backgroundColor: "#f0f0f0",
        }}
      >
        Drop here
      </div>

      <button
        onClick={() => {
          console.log("Check elements:");
          console.log("Draggable elements count:", document.querySelectorAll('[draggable="true"]').length);
        }}
        style={{ padding: "10px", marginTop: "10px" }}
      >
        Check Draggable Elements
      </button>
    </div>
  );
}


