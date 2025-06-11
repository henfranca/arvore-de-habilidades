import { useState, useEffect, useMemo } from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Componente para a barra de navegação dos níveis
const LevelNavigator = ({ levels, currentLevel, onLevelClick }) => (
  <div style={{
    position: 'absolute',
    top: 15,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'rgba(40, 42, 54, 0.9)',
    padding: '8px',
    borderRadius: '10px',
    border: '1px solid #4b5563',
    display: 'flex',
    gap: '10px'
  }}>
    {levels.map(level => (
      <button
        key={level.id}
        onClick={() => onLevelClick(level.id)}
        className={`level-tab ${currentLevel === level.id ? 'active' : ''} ${level.status}`}
        title={`Nível ${level.id} - ${level.status}`}
      >
        {level.id}
      </button>
    ))}
  </div>
);


function App() {
  // --- Estados do Componente ---
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [totalSP, setTotalSP] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);

  // --- Efeitos ---

  // Busca os dados do Firebase apenas uma vez.
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const nodesSnapshot = await getDocs(collection(db, 'nodes'));
        const nodesData = nodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllNodes(nodesData);

        const edgesSnapshot = await getDocs(collection(db, 'edges'));
        const edgesData = edgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllEdges(edgesData);
      } catch (error) {
        console.error("Erro ao buscar dados do Firestore:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Calcula o total de SP sempre que a lista de nós mudar.
  useEffect(() => {
    const spAcumulado = allNodes
      .filter(n => n.status === 'concluido' && n.sp)
      .reduce((sum, node) => sum + Number(node.sp), 0);
    setTotalSP(spAcumulado);
  }, [allNodes]);


  // Filtra os nós/conexões e aplica estilos com base no nível selecionado.
  const { nodesToDisplay, edgesToDisplay, levelStatus } = useMemo(() => {
    const filteredNodes = allNodes.filter(node => node.level === currentLevel);
    const nodeIdsInLevel = new Set(filteredNodes.map(node => node.id));
    
    // Mostra as conexões VISÍVEIS cujos nós estão no nível atual
    const filteredEdges = allEdges.filter(edge => 
        !edge.hidden && nodeIdsInLevel.has(edge.source) && nodeIdsInLevel.has(edge.target)
    );
    
    const nodesWithStyles = filteredNodes.map((node) => {
      // --- LÓGICA DE BLOQUEIO SIMPLIFICADA (DESATIVADA) ---
      // Apenas para garantir uma base estável.
      const isLocked = false; 

      let nodeStyle = {};
      let nodeClassName = '';

      if (isLocked && node.type !== 'ramo') {
        nodeStyle = { opacity: 0.5 };
        nodeClassName = 'node-locked';
      } else if (node.type === 'ramo') {
        nodeStyle = { backgroundColor: '#374151', color: '#ffffff', border: '1px solid #9CA3AF' };
        nodeClassName = 'node-ramo';
      } else if (node.status === 'concluido') {
        nodeStyle = { backgroundColor: '#A3E635', color: '#111827' };
        nodeClassName = 'node-estudo';
      } else {
        nodeClassName = 'node-estudo';
      }
      
      return {
        id: node.id,
        position: node.position,
        style: nodeStyle,
        className: nodeClassName,
        data: { 
          label: node.label,
          status: node.status,
          sp: node.sp,
          type: node.type,
          description: node.description,
          isLocked: isLocked
        }
      };
    });

    const totalLevels = Math.max(...allNodes.map(n => n.level).filter(l => typeof l === 'number'), -1) + 1;
    const levelStatus = Array.from({ length: totalLevels }, (_, i) => {
        const nodesInLevel = allNodes.filter(n => n.level === i && n.type === 'estudo');
        if (nodesInLevel.length === 0) return { id: i, status: 'locked' };
        
        const completedNodesInLevel = allNodes.filter(n => n.level === i && n.status === 'concluido').length;
        if (completedNodesInLevel === nodesInLevel.length) return { id: i, status: 'completed' };
        if (completedNodesInLevel > 0) return { id: i, status: 'in-progress' };
        return { id: i, status: 'locked' };
    });

    return { nodesToDisplay: nodesWithStyles, edgesToDisplay: filteredEdges, levelStatus: levelStatus };
  }, [allNodes, allEdges, currentLevel]);

  // --- Manipuladores de Eventos ---
  const onNodeClick = (event, clickedNode) => {
    setSelectedNode(clickedNode);
  };

  const handleStatusChange = async () => {
    if (!selectedNode || selectedNode.data.isLocked) return;

    const nodeRef = doc(db, 'nodes', selectedNode.id);
    const newStatus = selectedNode.data.status === 'concluido' ? 'pendente' : 'concluido';
    
    await updateDoc(nodeRef, { status: newStatus });

    setAllNodes(currentNodes =>
      currentNodes.map(n => n.id === selectedNode.id ? { ...n, status: newStatus } : n)
    );
    
    setSelectedNode(prev => ({
      ...prev, data: { ...prev.data, status: newStatus }
    }));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <LevelNavigator levels={levelStatus} currentLevel={currentLevel} onLevelClick={setCurrentLevel} />
      
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, background: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
        <strong>🏆 Study Points: {totalSP}</strong>
      </div>

      <ReactFlow
        nodes={nodesToDisplay}
        edges={edgesToDisplay}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNode(null)}
        proOptions={{ hideAttribution: true }}
      />

      {/* Painel de Detalhes */}
      {selectedNode && (
        <div style={{
          position: 'absolute', top: 15, right: 15, zIndex: 10, background: 'white',
          padding: '20px', borderRadius: '8px', border: '1px solid #eee',
          width: '250px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: 5, right: 5, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
          <h3 style={{ marginTop: 0 }}>{selectedNode.data.label}</h3> <hr />
          <p><strong>SP:</strong> {selectedNode.data.sp}</p>
          <p><strong>Status:</strong> {selectedNode.data.isLocked ? 'Bloqueado' : selectedNode.data.status}</p>
          {selectedNode.data.description && (
            <div><strong>Descrição:</strong><p style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedNode.data.description}</p></div>
          )}
          
          <button
            onClick={handleStatusChange} disabled={selectedNode.data.isLocked}
            style={{
              width: '100%', padding: '10px', marginTop: '15px', border: 'none',
              borderRadius: '6px', cursor: selectedNode.data.isLocked ? 'not-allowed' : 'pointer',
              backgroundColor: selectedNode.data.isLocked ? '#9ca3af' : selectedNode.data.status === 'concluido' ? '#f87171' : '#4ade80',
              color: 'white', fontWeight: 'bold', opacity: selectedNode.data.isLocked ? 0.7 : 1,
            }}>
            {selectedNode.data.isLocked ? 'Bloqueado' : (selectedNode.data.status === 'concluido' ? 'Marcar como Pendente' : 'Marcar como Concluído')}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
