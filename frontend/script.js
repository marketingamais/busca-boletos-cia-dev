document.addEventListener('DOMContentLoaded', () => {
    animateHeadline();
    setupCPFMask();
    
    document.getElementById('buscaForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('btnCopiarLinha').addEventListener('click', copyLinhaDigitavel);
});

// Animação do Headline
const loadingPhrases = [
    "Buscando suas informações...",
    "Consultando sua matrícula...",
    "Verificando parcelas em aberto...",
    "Acessando o portal do aluno...",
    "Quase lá, só mais um instante...",
    "Por favor, não feche ou atualize esta página."
];
let loadingInterval = null;

function startLoadingAnimation() {
    const loadingText = document.getElementById('loadingText');
    let idx = 0;
    if(loadingText) loadingText.innerText = loadingPhrases[0];
    loadingInterval = setInterval(() => {
        idx = (idx + 1) % loadingPhrases.length;
        if(loadingText) loadingText.innerText = loadingPhrases[idx];
    }, 3500);
}

function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

function animateHeadline() {
    const headline = document.getElementById('headline');
    const text = headline.innerText;
    headline.innerHTML = '';
    
    // Separa por palavras para manter os espaços
    const words = text.split(' ');
    
    words.forEach((word, wordIndex) => {
        const span = document.createElement('span');
        span.innerText = word;
        span.className = 'animated-word';
        span.style.display = 'inline-block';
        
        // Delay escalonado para cada palavra (mais rápido)
        span.style.animationDelay = `${wordIndex * 0.08}s`;
        
        headline.appendChild(span);
        
        // Adiciona o espaço de volta, exceto na última palavra
        if (wordIndex < words.length - 1) {
            headline.appendChild(document.createTextNode('\u00A0'));
        }
    });
}

// Máscara e Validação de CPF
function setupCPFMask() {
    const cpfInput = document.getElementById('cpf');
    
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove não números
        
        if (value.length > 11) value = value.slice(0, 11);
        
        // Aplica a máscara
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        
        e.target.value = value;
        
        // Se preencheu 14 caracteres (11 números + pontuação), valida
        if (e.target.value.length === 14) {
            const numStr = e.target.value.replace(/\D/g, '');
            if (!validarCPF(numStr)) {
                document.getElementById('cpfError').classList.remove('hidden');
                cpfInput.style.borderColor = 'var(--error)';
            } else {
                document.getElementById('cpfError').classList.add('hidden');
                cpfInput.style.borderColor = 'var(--border)';
            }
        } else {
            document.getElementById('cpfError').classList.add('hidden');
            cpfInput.style.borderColor = 'var(--border)';
        }
    });
}

function validarCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    return true;
}

// Submissão do Formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    
    if (!validarCPF(cpf)) {
        document.getElementById('cpfError').classList.remove('hidden');
        return;
    }
    
    // Abre o loading
    openModal('modalLoading');
    startLoadingAnimation();
    initGame();
    
    try {
        const webhookUrl = 'https://n8n.amais.io/webhook/buscar-boletos-novo';
        
        let data = null;
        let tentativas = 0;
        const maxTentativas = 5;

        while (tentativas < maxTentativas) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpf })
                });
                
                // Se der erro 502/504 ou não conseguir fazer o parse do JSON, vai cair no catch interno
                const jsonData = await response.json();
                
                // Verifica se o N8N retornou erro de timeout (Error in workflow)
                if (jsonData.message && jsonData.message.includes('Error in workflow')) {
                    throw new Error('N8N Timeout');
                }
                
                data = jsonData;
                break; // Sucesso, sai do loop
            } catch (err) {
                tentativas++;
                if (tentativas >= maxTentativas) {
                    throw err; // Se já tentou tudo, joga o erro para o catch principal
                }
                // Aguarda 3 segundos antes da próxima tentativa para não sobrecarregar
                await new Promise(r => setTimeout(r, 3000));
            }
        }
        
        stopLoadingAnimation();
        closeModal('modalLoading');
        cleanupGame();
        
        handleRobotResponse(data);
        
    } catch (error) {
        console.error('Erro após as tentativas:', error);
        stopLoadingAnimation();
        closeModal('modalLoading');
        cleanupGame();
        
        // Se falhar por timeout ou erro do servidor, mostra o modal de tentar novamente com mensagem genérica
        document.getElementById('textoTimeout').innerText = "Desculpe! O sistema está com uma alta demanda ou demorando muito para responder no momento. Por favor, tente novamente!";
        openModal('modalTimeout');
    }
}

// Controle de Fluxo
let currentProximoBoleto = null;

function handleRobotResponse(data) {
    console.log('Resposta N8N:', data);
    
    if (!data || Object.keys(data).length === 0 || (Array.isArray(data) && data.length === 0)) {
        openModal('modalCpfNaoEncontrado');
        return;
    }
    
    // Pega o nome formatado vindo do backend, ou usa 'Aluno'
    let nome = data.nomeFormatado ? data.nomeFormatado.trim() : "Aluno";
    
    if (nome !== "Aluno") {
        const parts = nome.split(' ').filter(p => p.trim().length > 0);
        if (parts.length > 1) {
            nome = parts[0] + ' ' + parts[parts.length - 1];
        }
    }
    
    if (data.status === 'erro') {
        if (data.message && data.message.includes('não possui senha')) {
            openModal('modalSemSenha');
        } else if (data.message && (data.message.toLowerCase().includes('encontrado') || data.message.toLowerCase().includes('existe'))) {
            openModal('modalCpfNaoEncontrado');
        } else if (data.message && data.message.toLowerCase().includes('falha ao acessar')) {
            document.getElementById('textoTimeout').innerText = `Desculpe, ${nome}! O sistema está com uma alta demanda ou demorando muito para responder no momento. Por favor, tente novamente!`;
            openModal('modalTimeout');
        } else {
            alert("⚠️ Instabilidade no sistema Sponte. Tente novamente mais tarde: " + data.message);
        }
    } else if (data.status === 'negociar') {
        document.getElementById('tituloNegociar').innerHTML = `Atenção, <strong>${nome}</strong>`;
        document.getElementById('textoNegociar').innerText = `Você está com mais de 5 dias de atraso, entre em contato com a Amais para regularizar os seus débitos.`;
        openModal('modalNegociar');
    } 
    else if (data.status === 'em_dia') {
        document.getElementById('tituloEmDia').innerHTML = `Parabéns, <strong>${nome}</strong>!`;
        document.getElementById('textoEmDia').innerText = `Você está em dia e não encontramos nenhuma parcela em atraso.`;
        
        currentProximoBoleto = data.proximoBoleto;
        
        const btnProximo = document.getElementById('btnQueroPagarProximo');
        if (currentProximoBoleto) {
            document.getElementById('textoEmDia').innerText += ` Encontramos a sua próxima parcela para ${currentProximoBoleto.dataVencimento}.`;
            btnProximo.style.display = 'flex';
            
            if (currentProximoBoleto.linhaDigitavel) {
                btnProximo.innerText = "PAGAR PRÓXIMO BOLETO";
                btnProximo.style.opacity = '1';
                btnProximo.style.cursor = 'pointer';
                btnProximo.onclick = () => {
                    showLinhaDigitavel(
                        currentProximoBoleto.linhaDigitavel, 
                        currentProximoBoleto.numParcela, 
                        currentProximoBoleto.dataVencimento
                    );
                };
            } else {
                btnProximo.innerText = "BOLETO AINDA NÃO LIBERADO PELA ESCOLA";
                btnProximo.style.opacity = '0.6';
                btnProximo.style.cursor = 'not-allowed';
                btnProximo.onclick = () => {
                    alert("A linha digitável deste boleto ainda não foi liberada pelo sistema da Sponte. Tente novamente mais próximo ao vencimento.");
                };
            }
        } else {
            btnProximo.style.display = 'none'; // Se não tiver próximos boletos
        }
        
        openModal('modalEmDia');
    }
    else if (data.status === 'pagar_atrasados') {
        document.getElementById('tituloPagarAtrasados').innerHTML = `<strong>${nome}</strong>, seus Boletos Vencidos`;
        renderBoletosList(data.parcelas);
        openBoletosScreen();
    } else {
        // Fallback de segurança caso a API retorne algo inesperado ou Error in workflow
        if (data.message && data.message.includes('Error in workflow')) {
            document.getElementById('textoTimeout').innerText = "Desculpe! O sistema está com uma alta demanda ou demorando muito para responder no momento. Por favor, tente novamente!";
            openModal('modalTimeout');
        } else {
            alert("⚠️ Erro desconhecido ao processar o retorno. Tente novamente mais tarde.");
        }
    }
}

function renderBoletosList(parcelas) {
    const listContainer = document.getElementById('boletosList');
    listContainer.innerHTML = '';
    
    parcelas.forEach(p => {
        const card = document.createElement('div');
        card.className = 'boleto-card';
        
        card.innerHTML = `
            <div class="boleto-info">
                <h4>Parcela ${p.numParcela}</h4>
                <p>Venceu em: ${p.dataVencimento}</p>
            </div>
            ${p.linhaDigitavel ? `
            <button class="btn-whatsapp pill-shape" style="padding: 0.75rem 1.5rem; font-size: 0.875rem;" onclick="showLinhaDigitavel('${p.linhaDigitavel}', '${p.numParcela}', '${p.dataVencimento}')">
                Pagar
            </button>
            ` : `
            <span style="font-size: 0.8rem; color: var(--error); padding: 0.5rem; background: #fff0f0; border-radius: 8px;">
                Boleto indisponível
            </span>
            `}
        `;
        listContainer.appendChild(card);
    });
}

// Funções de Modais
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    // Reseta o feedback de cópia se fechar o modal da linha
    if(id === 'modalLinhaDigitavel') {
        document.getElementById('copyFeedback').classList.add('hidden');
    }
}

function openBoletosScreen() {
    document.getElementById('telaBoletos').classList.remove('hidden');
}

function closeBoletosScreen() {
    document.getElementById('telaBoletos').classList.add('hidden');
}

function showLinhaDigitavel(linha, numParcela = null, dataVencimento = null) {
    document.getElementById('linhaTexto').innerText = linha;
    document.getElementById('copyFeedback').classList.add('hidden');
    
    const infoDiv = document.getElementById('infoProximoBoleto');
    if (numParcela && dataVencimento) {
        document.getElementById('numParcelaProximo').innerText = numParcela;
        document.getElementById('dataVencimentoProximo').innerText = dataVencimento;
        infoDiv.classList.remove('hidden');
    } else {
        infoDiv.classList.add('hidden');
    }
    
    openModal('modalLinhaDigitavel');
}

function copyLinhaDigitavel() {
    const texto = document.getElementById('linhaTexto').innerText;
    navigator.clipboard.writeText(texto).then(() => {
        const feedback = document.getElementById('copyFeedback');
        feedback.classList.remove('hidden');
        
        const box = document.querySelector('.linha-digitavel-box');
        if (box) {
            box.classList.remove('glow-green');
            void box.offsetWidth; // force reflow to restart animation
            box.classList.add('glow-green');
        }
        
        setTimeout(() => {
            feedback.classList.add('hidden');
            if (box) box.classList.remove('glow-green');
        }, 3000);
    });
}

// === MINI-GAME DE INGLÊS ===

const gameActivities = [
    {
        instruction: "Tradução de palavra",
        question: "O que significa a palavra 'Hello'?",
        options: ["Tchau", "Olá", "Obrigado", "Por favor"],
        correctIndex: 1
    },
    {
        instruction: "Tradução de palavra",
        question: "O que significa 'School'?",
        options: ["Escola", "Casa", "Trabalho", "Livro"],
        correctIndex: 0
    },
    {
        instruction: "Complete a frase",
        question: "Complete: 'I ___ a student.'",
        options: ["are", "is", "am", "be"],
        correctIndex: 2
    },
    {
        instruction: "Tradução de frase",
        question: "Como se diz 'Bom dia' em inglês?",
        options: ["Good night", "Good morning", "Good afternoon", "Good evening"],
        correctIndex: 1
    },
    {
        instruction: "Vocabulário",
        question: "Qual é a tradução de 'Beautiful'?",
        options: ["Feio", "Rápido", "Bonito(a)", "Forte"],
        correctIndex: 2
    },
    {
        instruction: "Gramática",
        question: "Qual está correto?",
        options: ["She don't like cats", "She doesn't like cats", "She not like cats", "She no like cats"],
        correctIndex: 1
    },
    {
        instruction: "Tradução de palavra",
        question: "O que significa 'Teacher'?",
        options: ["Aluno", "Diretor", "Professor(a)", "Médico"],
        correctIndex: 2
    },
    {
        instruction: "Complete a frase",
        question: "Complete: 'They ___ playing soccer right now.'",
        options: ["is", "was", "are", "be"],
        correctIndex: 2
    },
    {
        instruction: "Vocabulário",
        question: "Qual é a tradução de 'Window'?",
        options: ["Porta", "Teto", "Chão", "Janela"],
        correctIndex: 3
    },
    {
        instruction: "Expressão idiomática",
        question: "O que significa 'Break a leg'?",
        options: ["Quebre a perna", "Tome cuidado", "Boa sorte", "Vá embora"],
        correctIndex: 2
    },
    {
        instruction: "Tradução de frase",
        question: "Como se diz 'Eu tenho 20 anos' em inglês?",
        options: ["I have 20 years", "I am 20 years old", "I got 20 years", "I be 20 old"],
        correctIndex: 1
    },
    {
        instruction: "Gramática",
        question: "Qual é o plural de 'Child'?",
        options: ["Childs", "Childes", "Children", "Childrens"],
        correctIndex: 2
    },
    {
        instruction: "Vocabulário",
        question: "O que significa 'Hungry'?",
        options: ["Com sede", "Cansado", "Feliz", "Com fome"],
        correctIndex: 3
    },
    {
        instruction: "Tradução de frase",
        question: "Como se diz 'Qual é o seu nome?' em inglês?",
        options: ["How are you?", "Where are you from?", "What is your name?", "How old are you?"],
        correctIndex: 2
    },
    {
        instruction: "Vocabulário avançado",
        question: "O que significa 'Fluent'?",
        options: ["Iniciante", "Fluente", "Lento", "Confuso"],
        correctIndex: 1
    },
    {
        instruction: "Tradução de palavra",
        question: "Como se diz 'Maçã' em inglês?",
        options: ["Apple", "Orange", "Banana", "Grape"],
        correctIndex: 0
    },
    {
        instruction: "Gramática",
        question: "Qual é o passado de 'Go'?",
        options: ["Goed", "Gone", "Went", "Going"],
        correctIndex: 2
    },
    {
        instruction: "Vocabulário",
        question: "O que significa 'Always'?",
        options: ["Nunca", "Sempre", "Às vezes", "Hoje"],
        correctIndex: 1
    },
    {
        instruction: "Complete a frase",
        question: "Complete: '___ you speak English?'",
        options: ["Does", "Is", "Are", "Do"],
        correctIndex: 3
    },
    {
        instruction: "Expressão",
        question: "O que significa 'How are you?'",
        options: ["Onde você está?", "Como vai você?", "Quem é você?", "Qual a sua idade?"],
        correctIndex: 1
    },
    {
        instruction: "Vocabulário",
        question: "Como se diz 'Água' em inglês?",
        options: ["Fire", "Earth", "Water", "Wind"],
        correctIndex: 2
    },
    {
        instruction: "Gramática",
        question: "Complete: 'She ___ my best friend.'",
        options: ["am", "is", "are", "be"],
        correctIndex: 1
    },
    {
        instruction: "Tradução de palavra",
        question: "O que é 'Breakfast'?",
        options: ["Almoço", "Jantar", "Lanche", "Café da manhã"],
        correctIndex: 3
    },
    {
        instruction: "Cores",
        question: "Qual cor é 'Yellow'?",
        options: ["Azul", "Amarelo", "Verde", "Vermelho"],
        correctIndex: 1
    },
    {
        instruction: "Números",
        question: "Como se diz o número 10 em inglês?",
        options: ["Three", "Eight", "Ten", "Twelve"],
        correctIndex: 2
    },
    {
        instruction: "Animais",
        question: "O que é um 'Dog'?",
        options: ["Gato", "Cachorro", "Pássaro", "Peixe"],
        correctIndex: 1
    },
    {
        instruction: "Complete a frase",
        question: "Complete: 'I live ___ Brazil.'",
        options: ["on", "at", "in", "to"],
        correctIndex: 2
    },
    {
        instruction: "Vocabulário",
        question: "O que significa 'Never'?",
        options: ["Sempre", "Talvez", "Hoje", "Nunca"],
        correctIndex: 3
    },
    {
        instruction: "Verbos",
        question: "Qual é a tradução de 'To read'?",
        options: ["Escrever", "Ouvir", "Falar", "Ler"],
        correctIndex: 3
    },
    {
        instruction: "Família",
        question: "O que significa 'Brother'?",
        options: ["Irmão", "Pai", "Tio", "Avô"],
        correctIndex: 0
    },
    {
        instruction: "Complete a frase",
        question: "Complete: 'We ___ happy.'",
        options: ["am", "is", "are", "was"],
        correctIndex: 2
    },
    {
        instruction: "Clima",
        question: "O que significa 'Rain'?",
        options: ["Sol", "Vento", "Neve", "Chuva"],
        correctIndex: 3
    },
    {
        instruction: "Tradução de palavra",
        question: "Como se diz 'Por favor' em inglês?",
        options: ["Thank you", "Please", "Sorry", "Excuse me"],
        correctIndex: 1
    },
    {
        instruction: "Gramática",
        question: "Qual é o passado de 'Eat'?",
        options: ["Eated", "Ate", "Eaten", "Eating"],
        correctIndex: 1
    }
];

let currentGameIndex = 0;
let gameTimer = null;

function initGame() {
    cleanupGame(); // Ensure no left-over timers
    currentGameIndex = 0;
    
    document.getElementById('gameStartScreen').classList.remove('hidden');
    document.getElementById('gameActiveScreen').classList.add('hidden');
    document.getElementById('gameEndScreen').classList.add('hidden');
}

function startGame() {
    document.getElementById('gameStartScreen').classList.add('hidden');
    document.getElementById('gameActiveScreen').classList.remove('hidden');
    
    renderActivity(currentGameIndex);
}

function renderActivity(index) {
    const activity = gameActivities[index];
    const container = document.getElementById('gameActivityContent');
    const counter = document.getElementById('gameCounter');
    const progressBar = document.getElementById('gameProgressBar');
    
    // Update progress (starts at 0 width for the first question)
    counter.innerText = `Atividade ${index + 1} de ${gameActivities.length}`;
    progressBar.style.width = `${((index) / gameActivities.length) * 100}%`;
    
    // Clear and rebuild content
    container.innerHTML = `
        <div class="game-question-instruction">${activity.instruction}</div>
        <div class="game-question">${activity.question}</div>
        <div class="game-options" id="gameOptionsContainer">
            ${activity.options.map((opt, i) => `
                <button class="game-option" onclick="handleGameAnswer(${i})">${['A', 'B', 'C', 'D'][i]}) ${opt}</button>
            `).join('')}
        </div>
        <div id="gameFeedback" class="game-feedback"></div>
    `;
}

function handleGameAnswer(selectedIndex) {
    const activity = gameActivities[currentGameIndex];
    const optionsContainer = document.getElementById('gameOptionsContainer');
    const buttons = optionsContainer.querySelectorAll('.game-option');
    const feedback = document.getElementById('gameFeedback');
    
    // Disable all buttons to prevent double clicking
    buttons.forEach(btn => btn.disabled = true);
    
    if (selectedIndex === activity.correctIndex) {
        buttons[selectedIndex].classList.add('correct');
        feedback.innerHTML = '<span class="success">Correto! ✓</span>';
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[activity.correctIndex].classList.add('missed');
        feedback.innerHTML = '<span class="error">Quase! A resposta certa é destacada acima.</span>';
    }
    
    // Update progress bar early to reflect completion of this step
    const progressBar = document.getElementById('gameProgressBar');
    progressBar.style.width = `${((currentGameIndex + 1) / gameActivities.length) * 100}%`;
    
    // Move to next activity after 1.2s delay
    gameTimer = setTimeout(() => {
        nextActivity();
    }, 1200);
}

function nextActivity() {
    currentGameIndex++;
    
    if (currentGameIndex >= gameActivities.length) {
        // Game completed
        document.getElementById('gameActiveScreen').classList.add('hidden');
        document.getElementById('gameEndScreen').classList.remove('hidden');
    } else {
        renderActivity(currentGameIndex);
    }
}

function cleanupGame() {
    if (gameTimer) {
        clearTimeout(gameTimer);
        gameTimer = null;
    }
}
