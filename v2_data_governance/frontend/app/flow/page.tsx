"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Handle,
  Position,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";

// -----------------------------
// Custom Edge with Directional Animation
// -----------------------------
function ColumnEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, sourceHandleId, data } = props;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const columnName = sourceHandleId ? sourceHandleId.replace(/-out$/, '') : '';
  const direction = data?.direction || 'forward';

  return (
    <>
      <BaseEdge path={edgePath} {...props} />
      {/* Animated tracer - direction controlled */}
      <circle r="4" fill="#3b82f6" className="animate-pulse">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
          keyPoints={direction === 'forward' ? "0;1" : "1;0"}
          keyTimes="0;1"
        />
      </circle>
      {/* Column label floating near the source */}
      {columnName && (
        <g transform={`translate(${sourceX + 10},${sourceY - 10})`}>
          <rect
            x={-20}
            y={-12}
            width={80}
            height={20}
            rx={10}
            fill="white"
            fillOpacity={0.9}
            stroke="#3b82f6"
            strokeWidth={1}
            className="shadow-sm"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#1e40af"
            fontWeight="bold"
          >
            {columnName}
          </text>
        </g>
      )}
    </>
  );
}

// -----------------------------
// Custom Table Node – handles positioned per row with fixed row height
// -----------------------------
function TableNode({ data }: any) {
  const rowHeight = 36; // fixed height per row (in px) – matches py-2 (8px padding top/bottom) + text height (approx 20px)
  const headerHeight = 40; // approximate header height (includes padding, border, text)

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-xl p-3 min-w-[200px] relative"
    >
      <div className="font-bold text-sm border-b border-gray-200 pb-1 mb-1 text-gray-700">
        {data.tableName}
      </div>

      <div className="flex flex-col">
        {data.columns.map((col: string, index: number) => (
          <div
            key={index}
            className="relative flex items-center justify-between text-xs hover:bg-blue-50 transition-colors border-t border-gray-100 first:border-t-0"
            style={{ height: rowHeight }}
          >
            <span className="text-gray-600 font-medium flex-1 text-center">{col}</span>

            {/* Left handle (target) – positioned relative to this row */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col}-in`}
              className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md hover:scale-125 transition-transform"
              style={{ top: rowHeight / 2, left: -10 }}
              title={`Connect to ${col}`}
            />

            {/* Right handle (source) – positioned relative to this row */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col}-out`}
              className="w-4 h-4 bg-blue-500 border-2 border-white shadow-md hover:scale-125 transition-transform"
              style={{ top: rowHeight / 2, right: -10 }}
              title={`Connect from ${col}`}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  column: ColumnEdge,
};

// -----------------------------
// Initial Tables with columns
// -----------------------------
const initialNodes = [
  {
    id: "item_master",
    type: "tableNode",
    position: { x: 100, y: 100 },
    data: {
      tableName: "📦 Item Master",
      columns: ["item_code", "color", "brand"],
    },
  },
  {
    id: "po_detail",
    type: "tableNode",
    position: { x: 500, y: 200 },
    data: {
      tableName: "📝 PO Detail",
      columns: ["po_id", "item_code", "qty"],
    },
  },
  {
    id: "po_header",
    type: "tableNode",
    position: { x: 300, y: 400 },
    data: {
      tableName: "📑 PO Header",
      columns: ["po_id", "vendor", "date"],
    },
  },
];

// -----------------------------
// Main Component
// -----------------------------
export default function FlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showToolbar, setShowToolbar] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "column", data: { direction: 'forward' } }, eds));
    },
    [setEdges]
  );

  const addNewTable = () => {
    const newId = `table_${Date.now()}`;
    const newNode = {
      id: newId,
      type: "tableNode",
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: {
        tableName: `✨ New Table`,
        columns: ["id", "name", "created_at"],
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const toggleEdgeDirection = () => {
    const selectedEdges = edges.filter(edge => edge.selected);
    if (selectedEdges.length === 0) {
      alert("Select one or more edges first");
      return;
    }
    setEdges(eds =>
      eds.map(edge =>
        edge.selected
          ? { ...edge, data: { ...edge.data, direction: edge.data?.direction === 'forward' ? 'reverse' : 'forward' } }
          : edge
      )
    );
  };

  const logState = () => {
    console.log("NODES:", nodes);
    console.log("EDGES:", edges);
    alert("JSON output in console (F12)");
  };

  // Comprehensive connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.sourceHandle || !connection.targetHandle) return false;
    if (!connection.sourceHandle.includes('-out') || !connection.targetHandle.includes('-in')) return false;
    if (connection.source === connection.target) return false; // same table

    const sourceCol = connection.sourceHandle.replace('-out', '');
    const targetCol = connection.targetHandle.replace('-in', '');
    if (connection.source === connection.target && sourceCol === targetCol) return false; // same column

    return true;
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Floating Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-2 border border-white/40"
          >
            <button
              onClick={addNewTable}
              className="px-5 py-2 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 font-medium"
            >
              ➕ Add Table
            </button>
            <button
              onClick={toggleEdgeDirection}
              className="px-5 py-2 bg-purple-500 text-white rounded-xl shadow-md hover:bg-purple-600 transition-all hover:scale-105 active:scale-95 font-medium"
            >
              🔄 Toggle Direction
            </button>
            <button
              onClick={logState}
              className="px-5 py-2 bg-gray-700 text-white rounded-xl shadow-md hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 font-medium"
            >
              📋 Export JSON
            </button>
            <button
              onClick={() => setShowToolbar(false)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="rounded-3xl shadow-inner"
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }}
        connectionRadius={20}
        isValidConnection={isValidConnection}
      >
        <Background 
          gap={20} 
          color="#cbd5e1" 
          className="bg-gradient-to-br from-slate-50/50 to-slate-100/50"
        />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.tableName) {
              case '📦 Item Master': return '#60a5fa';
              case '📝 PO Detail': return '#34d399';
              case '📑 PO Header': return '#fbbf24';
              default: return '#c084fc';
            }
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="rounded-xl shadow-lg"
        />
        <Controls 
          showInteractive={false}
          className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-white/40"
        />
      </ReactFlow>
    </div>
  );
}