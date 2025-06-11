// Importa a nossa conexão com o banco de dados
import { db } from './src/firebase.js';

// Importa as funções do Firestore para criar documentos
import { doc, setDoc } from 'firebase/firestore';

// Importa os dados do nosso ficheiro JSON
import treeData from './treeData_detalhado.json' with { type: 'json' };

console.log('Iniciando o processo de "seeding"...');

// Função para enviar os nós para o Firebase
const seedNodes = async () => {
  console.log('A enviar nós para o Firestore...');
  for (const node of treeData.nodes) {
    const nodeRef = doc(db, 'nodes', node.id);
    // Usamos node.data para guardar apenas o conteúdo de "data" do JSON
    await setDoc(nodeRef, node.data);
    console.log(`Nó "${node.data.label}" adicionado.`);
  }
  console.log('Todos os nós foram enviados com sucesso!');
};

// Função para enviar as conexões (edges) - VERSÃO CORRIGIDA E ROBUSTA
const seedEdges = async () => {
  console.log('A enviar conexões para o Firestore...');
  for (const edge of treeData.edges) {
    const edgeRef = doc(db, 'edges', edge.id);
    
    // ** A CORREÇÃO ESTÁ AQUI **
    // Usamos "desestruturação" para criar um novo objeto 'edgeData'
    // que contém todas as propriedades do 'edge' do JSON, exceto o 'id'.
    // Isto garante que 'hidden' e 'animated' sejam copiados corretamente.
    const { id, ...edgeData } = edge;

    await setDoc(edgeRef, edgeData);
    console.log(`Conexão "${id}" adicionada.`);
  }
  console.log('Todas as conexões foram enviadas com sucesso!');
};

// Função principal que executa tudo
const seedDatabase = async () => {
  try {
    await seedNodes();
    await seedEdges();
    console.log('✅ Base de dados semeada com sucesso!');
  } catch (error) {
    console.error("❌ Erro ao semear a base de dados:", error);
  }
};

// Inicia o processo
seedDatabase();
