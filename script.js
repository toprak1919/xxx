        // DOM Elements
        const hubView = document.getElementById('hub-view');
        const gameContainers = {};
        const canvases = {};
        const contexts = {};
        const gameStates = {}; 
        const animationFrameIds = {};
function getHighScore(id){
    const v = localStorage.getItem(`${id}-highscore`);
    return v ? parseInt(v,10) : 0;
}

function setHighScore(id,score){
    if(score>getHighScore(id)) localStorage.setItem(`${id}-highscore`, score);
}

function updateHighScoreDisplay(id){
    const el = document.getElementById(`${id}-best`);
    if(el) el.textContent = getHighScore(id);
}

        const messageOverlays = {};
        let globalDragState = { isDragging: false, item: null, offsetX: 0, offsetY: 0, gameId: null, pathPoints: [] };


        const gameIds = ['elementalBending', 'sunflowerBloom', 'cabbageCartChaos', 'spiritWorldPath', 'appasSkyJourney', 'momoFruitCatch'];

        gameIds.forEach(id => {
            gameContainers[id] = document.getElementById(`${id}-container`);
            canvases[id] = document.getElementById(`${id}-canvas`);
            messageOverlays[id] = document.getElementById(`${id}-message`);
            gameStates[id] = gameStates[id] || { score: 0, running: false, initialized: false, gameOver: false };
            const startButton = document.getElementById(`start-${id}`);
            if (startButton) {
                startButton.addEventListener('click', () => startGame(id));
            }
            updateHighScoreDisplay(id);
        });
        
        function resizeCanvas(canvas) {
            if (!canvas) return;
            const container = canvas.parentElement; 
            if (!container) return;
            const containerWidth = container.offsetWidth;
            container.style.height = `${containerWidth * (3/4)}px`;
            canvas.style.width ='100%';
            canvas.style.height='100%';
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function showHub() {
            hubView.classList.remove('hidden');
            requestAnimationFrame(() => hubView.classList.add('active'));
            gameIds.forEach(id => {
                if (gameContainers[id]) {
                    gameContainers[id].classList.remove('active');
                    gameContainers[id].classList.add('hidden');
                }
                stopGame(id);
            });
            window.scrollTo(0, 0);
        }

        function showGame(gameId) {
            hubView.classList.remove('active');
            hubView.classList.add('hidden');
            gameIds.forEach(id => {
                if (gameContainers[id]) {
                    gameContainers[id].classList.remove('active');
                    gameContainers[id].classList.add('hidden');
                }
                stopGame(id);
            });

            if (gameContainers[gameId]) {
                gameContainers[gameId].classList.remove('hidden');
                requestAnimationFrame(() => gameContainers[gameId].classList.add('active'));
                if (!gameStates[gameId].initialized) {
                    initializeGameCanvas(gameId);
                } else {
                    resizeCanvas(canvases[gameId]);
                    drawInitialCanvasState(gameId);
                }
                if(messageOverlays[gameId]) messageOverlays[gameId].classList.add('hidden');
            }
            window.scrollTo(0, 0);
        }
        
        function initializeGameCanvas(gameId) {
            const canvas = canvases[gameId];
            if (!canvas) return;
            resizeCanvas(canvas); 
            contexts[gameId] = canvas.getContext('2d');
            gameStates[gameId].initialized = true;
            drawInitialCanvasState(gameId);
            
            canvas.removeEventListener('mousedown', handleDragStart);
            canvas.removeEventListener('mousemove', handleDragging);
            canvas.removeEventListener('mouseup', handleDragEnd);
            canvas.removeEventListener('mouseleave', handleDragEnd);
            canvas.removeEventListener('touchstart', handleDragStart, { passive: false });
            canvas.removeEventListener('touchmove', handleDragging, { passive: false });
            canvas.removeEventListener('touchend', handleDragEnd);
            canvas.removeEventListener('touchcancel', handleDragEnd);

            if (['elementalBending', 'cabbageCartChaos', 'spiritWorldPath', 'appasSkyJourney', 'momoFruitCatch'].includes(gameId)) {
                canvas.addEventListener('mousedown', handleDragStart);
                canvas.addEventListener('mousemove', handleDragging);
                canvas.addEventListener('mouseup', handleDragEnd);
                canvas.addEventListener('mouseleave', handleDragEnd);
                canvas.addEventListener('touchstart', handleDragStart, { passive: false });
                canvas.addEventListener('touchmove', handleDragging, { passive: false });
                canvas.addEventListener('touchend', handleDragEnd);
                canvas.addEventListener('touchcancel', handleDragEnd);
            } else if (gameId === 'sunflowerBloom') {
                 canvas.onclick = (event) => handleGameClick(gameId, event);
            }
        }
        
        function drawInitialCanvasState(gameId) {
            const ctx = contexts[gameId];
            const canvas = canvases[gameId];
            if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#E0E0E0'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#555';
            ctx.font = `${Math.min(canvas.width / 18, 20)}px Inter`; 
            ctx.textAlign = 'center';
            const gameName = gameId.replace(/([A-Z])/g, ' $1').trim();
            ctx.fillText(`Welcome to ${gameName}!`, canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText('Press Start to Play.', canvas.width / 2, canvas.height / 2 + 20);
        }

        function displayGameMessage(gameId, message, duration = 0, showRestart = false) {
            const overlay = messageOverlays[gameId];
            if (overlay) {
                const restartBtn = showRestart ? `<br><button class="game-button restart-button mt-2">Restart</button>` : '';
                overlay.innerHTML = message + restartBtn;
                overlay.classList.remove('hidden');
                if (showRestart) {
                    const btn = overlay.querySelector('.restart-button');
                    if (btn) btn.onclick = () => startGame(gameId);
                }
                if (duration > 0) {
                    setTimeout(() => {
                        if (overlay) overlay.classList.add('hidden'); // Check if overlay still exists
                    }, duration);
                }
            }
        }

        function stopGame(gameId) {
            if (gameStates[gameId]) {
            if (gameStates[gameId].gameOver) {
                setHighScore(gameId, gameStates[gameId].score);
                updateHighScoreDisplay(gameId);
            }
                gameStates[gameId].running = false;
            }
            if (animationFrameIds[gameId]) {
                cancelAnimationFrame(animationFrameIds[gameId]);
                animationFrameIds[gameId] = null;
            }
            globalDragState = { isDragging: false, item: null, offsetX: 0, offsetY: 0, gameId: null, pathPoints: [] };
        }

        function startGame(gameId) {
            stopGame(gameId); 
            if (!gameStates[gameId].initialized) {
                initializeGameCanvas(gameId);
            }
            resizeCanvas(canvases[gameId]);
            if (!contexts[gameId]) contexts[gameId] = canvases[gameId].getContext('2d');

            if(messageOverlays[gameId]) messageOverlays[gameId].classList.add('hidden');

            gameStates[gameId].running = true;
            gameStates[gameId].gameOver = false;
            gameStates[gameId].score = 0;
            updateHighScoreDisplay(gameId);

            switch (gameId) {
                case 'elementalBending': initElementalBending(); break;
                case 'sunflowerBloom': initSunflowerBloom(); break;
                case 'cabbageCartChaos': initCabbageCartChaos(); break;
                case 'spiritWorldPath': initSpiritWorldPath(); break;
                case 'appasSkyJourney': initAppasSkyJourney(); break;
                case 'momoFruitCatch': initMomoFruitCatch(); break;
            }
            gameLoop(gameId);
        }

        function gameLoop(gameId) {
            if (!gameStates[gameId] || !gameStates[gameId].running) {
                return;
            }

            switch (gameId) {
                case 'elementalBending': updateElementalBending(); drawElementalBending(); break;
                case 'sunflowerBloom': updateSunflowerBloom(); drawSunflowerBloom(); break;
                case 'cabbageCartChaos': updateCabbageCartChaos(); drawCabbageCartChaos(); break;
                case 'spiritWorldPath': updateSpiritWorldPath(); drawSpiritWorldPath(); break;
                case 'appasSkyJourney': updateAppasSkyJourney(); drawAppasSkyJourney(); break;
                case 'momoFruitCatch': updateMomoFruitCatch(); drawMomoFruitCatch(); break;
            }

            if (gameStates[gameId].running) {
                animationFrameIds[gameId] = requestAnimationFrame(() => gameLoop(gameId));
            }
        }
        
        function getEventCoords(canvas, event) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            let clientX, clientY;
            if (event.touches && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }
        function handleGameClick(gameId, event) {
             if (!gameStates[gameId].running || gameStates[gameId].gameOver) return;
             const coords = getEventCoords(canvases[gameId], event);
             if (gameId === 'sunflowerBloom') {
                handleSunflowerBloomClick(coords);
             }
        }

        function handleDragStart(event) {
            event.preventDefault();
            const gameId = Object.keys(canvases).find(id => canvases[id] === event.target);
            if (!gameId || !gameStates[gameId]?.running || gameStates[gameId].gameOver) return;
            
            const coords = getEventCoords(canvases[gameId], event);
            globalDragState.gameId = gameId;
            globalDragState.pathPoints = []; // Reset path for path drawing games

            switch (gameId) {
                case 'elementalBending':
                    if (EB.currentSymbol && Math.hypot(coords.x - EB.currentSymbol.x, coords.y - EB.currentSymbol.y) < EB.currentSymbol.radius) {
                        globalDragState.isDragging = true; globalDragState.item = EB.currentSymbol;
                        globalDragState.offsetX = coords.x - EB.currentSymbol.x; globalDragState.offsetY = coords.y - EB.currentSymbol.y;
                    }
                    break;
                case 'cabbageCartChaos':
                    if (CCC.cabbage && !CCC.cabbage.isDragging && Math.hypot(coords.x - CCC.cabbage.x, coords.y - CCC.cabbage.y) < CCC.cabbage.radius) {
                        globalDragState.isDragging = true; CCC.cabbage.isDragging = true; globalDragState.item = CCC.cabbage;
                        globalDragState.offsetX = coords.x - CCC.cabbage.x; globalDragState.offsetY = coords.y - CCC.cabbage.y;
                    }
                    break;
                case 'spiritWorldPath':
                    globalDragState.isDragging = true; // Start path drawing immediately
                    globalDragState.pathPoints.push({x: coords.x, y: coords.y});
                    // Check if starting on the first required node
                    if (SWP.nodes.length > 0 && SWP.nodes[SWP.connectedCount]) {
                        const firstNode = SWP.nodes[SWP.connectedCount];
                         if (Math.hypot(coords.x - firstNode.x, coords.y - firstNode.y) < firstNode.radius) {
                            // Valid start, handled by dragging logic
                         } else {
                            // Invalid start point for path, reset drag
                            globalDragState.isDragging = false;
                            globalDragState.pathPoints = [];
                         }
                    }
                    break;
                case 'appasSkyJourney':
                    if (coords.x > ASJ.appa.x && coords.x < ASJ.appa.x + ASJ.appa.width && coords.y > ASJ.appa.y && coords.y < ASJ.appa.y + ASJ.appa.height) {
                        globalDragState.isDragging = true; globalDragState.item = ASJ.appa;
                        globalDragState.offsetX = coords.x - ASJ.appa.x; globalDragState.offsetY = coords.y - ASJ.appa.y;
                    }
                    break;
                case 'momoFruitCatch':
                    if (coords.x > MFC.momo.x && coords.x < MFC.momo.x + MFC.momo.width && coords.y > MFC.momo.y && coords.y < MFC.momo.y + MFC.momo.height) {
                        globalDragState.isDragging = true; globalDragState.item = MFC.momo;
                        globalDragState.offsetX = coords.x - MFC.momo.x; globalDragState.offsetY = coords.y - MFC.momo.y;
                    }
                    break;
            }
        }

        function handleDragging(event) {
            event.preventDefault();
            if (!globalDragState.isDragging || !gameStates[globalDragState.gameId]?.running) return;
            
            const gameId = globalDragState.gameId;
            const coords = getEventCoords(canvases[gameId], event);

            if (gameId === 'spiritWorldPath') {
                globalDragState.pathPoints.push({x: coords.x, y: coords.y});
                // Check for node connections during drag
                handleSpiritWorldPathLogic(); 
            } else if (globalDragState.item) {
                globalDragState.item.x = coords.x - globalDragState.offsetX;
                globalDragState.item.y = coords.y - globalDragState.offsetY;
                if (gameId === 'appasSkyJourney' || gameId === 'momoFruitCatch') {
                    const canvas = canvases[gameId];
                    globalDragState.item.x = Math.max(0, Math.min(canvas.width - globalDragState.item.width, globalDragState.item.x));
                    globalDragState.item.y = Math.max(0, Math.min(canvas.height - globalDragState.item.height, globalDragState.item.y));
                }
            }
        }

        function handleDragEnd(event) {
            if (!gameStates[globalDragState.gameId]?.running) {
                 globalDragState = { isDragging: false, item: null, offsetX: 0, offsetY: 0, gameId: null, pathPoints: [] };
                 return;
            }
            
            const gameId = globalDragState.gameId;
            switch (gameId) {
                case 'elementalBending': if(globalDragState.item) handleElementalBendingDrop(globalDragState.item); break;
                case 'cabbageCartChaos': if(globalDragState.item) handleCabbageCartChaosDrop(globalDragState.item); break;
                case 'spiritWorldPath': handleSpiritWorldPathDrop(); break; 
            }
            globalDragState = { isDragging: false, item: null, offsetX: 0, offsetY: 0, gameId: null, pathPoints: [] };
        }

        // --- Elemental Bending Practice ---
        const EB = {};
        const ELEMENTS = { WATER: 'Water', EARTH: 'Earth', FIRE: 'Fire', AIR: 'Air' };
        const ELEMENT_COLORS = { Water: '#3498DB', Earth: '#9B59B6', Fire: '#E74C3C', Air: '#ECF0F1' };
        const ELEMENT_SYMBOLS_UNICODE = { Water: '💧', Earth: '⛰️', Fire: '🔥', Air: '💨' };

        function initElementalBending() {
            const canvas = canvases.elementalBending;
            EB.quadrants = [
                { id: ELEMENTS.WATER, x: 0, y: 0, width: canvas.width / 2, height: canvas.height / 2, color: ELEMENT_COLORS.Water },
                { id: ELEMENTS.EARTH, x: canvas.width / 2, y: 0, width: canvas.width / 2, height: canvas.height / 2, color: ELEMENT_COLORS.Earth },
                { id: ELEMENTS.FIRE, x: 0, y: canvas.height / 2, width: canvas.width / 2, height: canvas.height / 2, color: ELEMENT_COLORS.Fire },
                { id: ELEMENTS.AIR, x: canvas.width / 2, y: canvas.height / 2, width: canvas.width / 2, height: canvas.height / 2, color: '#bdc3c7' }
            ];
            EB.targetSymbols = 10; EB.symbolsSorted = 0; EB.symbolTimer = 0; EB.symbolTimeLimit = 10000; EB.currentSymbol = null;
            gameStates.elementalBending.score = 0; spawnNewEBSymbol(); updateElementalBendingScoreDisplay();
        }
        function spawnNewEBSymbol() {
            if (EB.symbolsSorted >= EB.targetSymbols) {
                gameStates.elementalBending.gameOver = true; displayGameMessage('elementalBending', `Master Bender!<br>${EB.targetSymbols} Symbols Sorted!`, 0, true); stopGame('elementalBending'); return;
            }
            const canvas = canvases.elementalBending; const elementKeys = Object.keys(ELEMENTS);
            const randomElement = ELEMENTS[elementKeys[Math.floor(Math.random() * elementKeys.length)]];
            EB.currentSymbol = { id: randomElement, x: canvas.width / 2, y: canvas.height / 2, initialX: canvas.width / 2, initialY: canvas.height / 2,
                radius: Math.min(canvas.width, canvas.height) / 12, color: ELEMENT_COLORS[randomElement], symbol: ELEMENT_SYMBOLS_UNICODE[randomElement] };
            EB.symbolTimer = Date.now();
        }
        function handleElementalBendingDrop(droppedSymbol) {
            let placedCorrectly = false;
            for (let quad of EB.quadrants) {
                if (droppedSymbol.x > quad.x && droppedSymbol.x < quad.x + quad.width && droppedSymbol.y > quad.y && droppedSymbol.y < quad.y + quad.height) {
                    if (droppedSymbol.id === quad.id) { placedCorrectly = true; gameStates.elementalBending.score++; EB.symbolsSorted++; } break;
                }
            }
            if (!placedCorrectly) { displayGameMessage('elementalBending', `Wrong Quadrant!`, 1000); }
            EB.currentSymbol.x = EB.currentSymbol.initialX; EB.currentSymbol.y = EB.currentSymbol.initialY;
            spawnNewEBSymbol(); updateElementalBendingScoreDisplay();
        }
        function updateElementalBending() {
            if (gameStates.elementalBending.gameOver || !EB.currentSymbol) return;
            if (Date.now() - EB.symbolTimer > EB.symbolTimeLimit) {
                displayGameMessage('elementalBending', `Time's Up!`, 1000); EB.currentSymbol.x = EB.currentSymbol.initialX; EB.currentSymbol.y = EB.currentSymbol.initialY; spawnNewEBSymbol();
            }
            updateElementalBendingScoreDisplay();
        }
        function drawElementalBending() {
            const ctx = contexts.elementalBending; const canvas = canvases.elementalBending; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            EB.quadrants.forEach(quad => {
                ctx.fillStyle = quad.color; ctx.fillRect(quad.x, quad.y, quad.width, quad.height);
                ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 2; ctx.strokeRect(quad.x, quad.y, quad.width, quad.height);
                ctx.fillStyle = quad.id === ELEMENTS.AIR ? '#2c3e50' : '#FFFFFF'; ctx.font = `${Math.min(quad.width, quad.height) / 5}px Inter`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(quad.id, quad.x + quad.width / 2, quad.y + quad.height / 2);
            });
            if (EB.currentSymbol) {
                ctx.beginPath(); ctx.arc(EB.currentSymbol.x, EB.currentSymbol.y, EB.currentSymbol.radius, 0, Math.PI * 2);
                ctx.fillStyle = EB.currentSymbol.color; ctx.fill(); ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = EB.currentSymbol.id === ELEMENTS.AIR ? '#000000' : '#FFFFFF'; ctx.font = `${EB.currentSymbol.radius * 1.2}px Inter`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(EB.currentSymbol.symbol, EB.currentSymbol.x, EB.currentSymbol.y);
                const timeRemainingRatio = 1 - ((Date.now() - EB.symbolTimer) / EB.symbolTimeLimit);
                if (timeRemainingRatio >= 0) {
                    ctx.fillStyle = '#2ecc71'; ctx.fillRect(EB.currentSymbol.x - EB.currentSymbol.radius, EB.currentSymbol.y + EB.currentSymbol.radius + 5, EB.currentSymbol.radius * 2 * timeRemainingRatio, 10);
                }
            }
        }
        function updateElementalBendingScoreDisplay() {
            const timeLeft = EB.currentSymbol ? Math.max(0, (EB.symbolTimeLimit - (Date.now() - EB.symbolTimer)) / 1000).toFixed(1) : (EB.symbolTimeLimit/1000).toFixed(1);
            document.getElementById("elementalBending-score").textContent = `Symbols Sorted: ${gameStates.elementalBending.score} / ${EB.targetSymbols} | Time Left: ${timeLeft}s | Best: ${getHighScore("elementalBending")}`;
        }

        // --- Sunflower Bloom Clicker (Largely Unchanged) ---
        const SB = {};
        function initSunflowerBloom() { /* ... same as before ... */ 
            SB.blooms = []; SB.maxBlooms = 15; gameStates.sunflowerBloom.score = 0; updateSunflowerBloomScoreDisplay();
        }
        function handleSunflowerBloomClick(coords) { /* ... same as before ... */ 
            if (SB.blooms.length >= SB.maxBlooms) return;
            const bloomSize = Math.random() * 15 + 20; const bloomColor = `hsl(${Math.random() * 60 + 20}, 100%, 60%)`;
            SB.blooms.push({ x: coords.x, y: coords.y, size: bloomSize, color: bloomColor, growth: 0.1, maxSize: bloomSize });
            gameStates.sunflowerBloom.score = SB.blooms.length; updateSunflowerBloomScoreDisplay();
            if (SB.blooms.length >= SB.maxBlooms) { gameStates.sunflowerBloom.gameOver = true; displayGameMessage('sunflowerBloom', `Garden Full! You Win!<br>${SB.maxBlooms} Blooms!`, 0, true); stopGame('sunflowerBloom');}
        }
        function updateSunflowerBloom() { /* ... same as before ... */ 
            if (gameStates.sunflowerBloom.gameOver) return; SB.blooms.forEach(b => { if (b.growth < 1) b.growth = Math.min(1, b.growth + 0.05); });
        }
        function drawSunflowerBloom() { /* ... same as before ... */ 
            const ctx = contexts.sunflowerBloom; const canvas = canvases.sunflowerBloom; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
            ctx.fillStyle = '#228B22'; ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25); 
            SB.blooms.forEach(b => {
                const currentSize = b.maxSize * b.growth; ctx.fillStyle = '#006400'; 
                ctx.fillRect(b.x - currentSize/10, b.y, currentSize/5, canvas.height - b.y);
                ctx.beginPath(); ctx.arc(b.x, b.y, currentSize / 3, 0, Math.PI * 2); ctx.fillStyle = '#8B4513'; ctx.fill();
                const numPetals = 8;
                for (let i = 0; i < numPetals; i++) {
                    ctx.beginPath(); const angle = (i / numPetals) * Math.PI * 2;
                    const petalX = b.x + Math.cos(angle) * currentSize * 0.6; const petalY = b.y + Math.sin(angle) * currentSize * 0.6;
                    ctx.ellipse(petalX, petalY, currentSize / 2, currentSize / 5, angle, 0, Math.PI * 2); ctx.fillStyle = b.color; ctx.fill();
                }
            });
        }
        function updateSunflowerBloomScoreDisplay() { /* ... same as before ... */
            document.getElementById("sunflowerBloom-score").textContent = `Blooms: ${gameStates.sunflowerBloom.score} / ${SB.maxBlooms} | Best: ${getHighScore("sunflowerBloom")}`;
        }

        // --- Cabbage Cart Chaos ---
        const CCC = {};
        function initCabbageCartChaos() {
            const canvas = canvases.cabbageCartChaos;
            CCC.cart = { x: 50, y: canvas.height / 2 - 25, width: 60, height: 50, color: '#8B4513' }; // Brown cart
            CCC.stall = { x: canvas.width - 100, y: canvas.height / 2 - 30, width: 80, height: 60, color: '#A0522D' }; // Lighter brown stall
            CCC.cabbage = null; // Current draggable cabbage
            CCC.obstacles = [];
            CCC.obstacleSpeed = 2;
            CCC.obstacleSpawnInterval = 2000; // ms
            CCC.lastObstacleSpawn = 0;
            CCC.cabbagesDelivered = 0;
            CCC.cabbagesLost = 0;
            CCC.targetDeliveries = 10;
            CCC.maxLost = 5;
            gameStates.cabbageCartChaos.score = 0;
            spawnNewCabbage();
            updateCabbageCartChaosScoreDisplay();
        }
        function spawnNewCabbage() {
            if (CCC.cabbagesDelivered >= CCC.targetDeliveries) {
                gameStates.cabbageCartChaos.gameOver = true;
                displayGameMessage('cabbageCartChaos', `All Cabbages Delivered!<br>Merchant is Happy!`, 0, true);
                stopGame('cabbageCartChaos');
                return;
            }
            CCC.cabbage = { x: CCC.cart.x + CCC.cart.width / 2, y: CCC.cart.y + CCC.cart.height / 2, radius: 15, color: '#2ECC71', isDragging: false, initialX: CCC.cart.x + CCC.cart.width / 2, initialY: CCC.cart.y + CCC.cart.height / 2 };
        }
        function handleCabbageCartChaosDrop(droppedCabbage) {
            if (!droppedCabbage) return;
            droppedCabbage.isDragging = false; // Mark dragging as false regardless of outcome
            // Check if dropped on stall
            if (droppedCabbage.x > CCC.stall.x && droppedCabbage.x < CCC.stall.x + CCC.stall.width &&
                droppedCabbage.y > CCC.stall.y && droppedCabbage.y < CCC.stall.y + CCC.stall.height) {
                CCC.cabbagesDelivered++;
                gameStates.cabbageCartChaos.score++;
                displayGameMessage('cabbageCartChaos', `Cabbage Delivered!`, 800);
            } else {
                // Not on stall, considered lost or just reset (let's reset for now)
                // displayGameMessage('cabbageCartChaos', `Dropped!`, 800);
                // CCC.cabbagesLost++; // This would be if dropping anywhere but stall is a loss
            }
            spawnNewCabbage(); // Spawn next cabbage
            updateCabbageCartChaosScoreDisplay();
        }
        function updateCabbageCartChaos() {
            if (gameStates.cabbageCartChaos.gameOver) return;
            const canvas = canvases.cabbageCartChaos;
            const now = Date.now();

            // Spawn Obstacles (e.g., Aang on air scooter, Momo)
            if (now - CCC.lastObstacleSpawn > CCC.obstacleSpawnInterval) {
                const side = Math.random() < 0.5; // true for top, false for bottom
                CCC.obstacles.push({
                    x: Math.random() < 0.5 ? -30 : canvas.width + 30, // Start off-screen left or right
                    y: Math.random() * canvas.height,
                    width: 30, height: 30,
                    vx: (Math.random() < 0.5 ? 1 : -1) * (CCC.obstacleSpeed + Math.random()), // Random direction and slight speed variation
                    vy: (Math.random() - 0.5) * CCC.obstacleSpeed * 0.5, // Slight vertical drift
                    color: `hsl(${Math.random()*360}, 70%, 60%)`, // Random color for "characters"
                    shape: Math.random() < 0.5 ? 'circle' : 'rect' // Random shape
                });
                CCC.lastObstacleSpawn = now;
            }

            // Move Obstacles
            for (let i = CCC.obstacles.length - 1; i >= 0; i--) {
                const obs = CCC.obstacles[i];
                obs.x += obs.vx;
                obs.y += obs.vy;

                // Remove if way off screen
                if (obs.x < -100 || obs.x > canvas.width + 100 || obs.y < -100 || obs.y > canvas.height + 100) {
                    CCC.obstacles.splice(i, 1);
                }
                // Collision with dragged cabbage
                if (CCC.cabbage && CCC.cabbage.isDragging) {
                    let collision = false;
                    if (obs.shape === 'circle') {
                        collision = Math.hypot(CCC.cabbage.x - obs.x, CCC.cabbage.y - obs.y) < CCC.cabbage.radius + obs.width/2;
                    } else { // rect
                         collision = CCC.cabbage.x - CCC.cabbage.radius < obs.x + obs.width &&
                                     CCC.cabbage.x + CCC.cabbage.radius > obs.x &&
                                     CCC.cabbage.y - CCC.cabbage.radius < obs.y + obs.height &&
                                     CCC.cabbage.y + CCC.cabbage.radius > obs.y;
                    }

                    if (collision) {
                        CCC.obstacles.splice(i, 1); // Remove obstacle
                        CCC.cabbagesLost++;
                        displayGameMessage('cabbageCartChaos', `MY CABBAGE! Lost!`, 1000);
                        CCC.cabbage.isDragging = false; // Stop dragging this cabbage
                        spawnNewCabbage(); // Spawn a new one
                        if (CCC.cabbagesLost >= CCC.maxLost) {
                            gameStates.cabbageCartChaos.gameOver = true;
                            displayGameMessage('cabbageCartChaos', `Too Many Lost Cabbages!<br>Game Over!`, 0, true);
                            stopGame('cabbageCartChaos');
                        }
                        break; // Stop checking other obstacles for this frame
                    }
                }
            }
            updateCabbageCartChaosScoreDisplay();
        }
        function drawCabbageCartChaos() {
            const ctx = contexts.cabbageCartChaos; const canvas = canvases.cabbageCartChaos; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#D2B48C'; ctx.fillRect(0, 0, canvas.width, canvas.height); // Earthy background

            // Draw Cart & Stall
            ctx.fillStyle = CCC.cart.color; ctx.fillRect(CCC.cart.x, CCC.cart.y, CCC.cart.width, CCC.cart.height);
            ctx.fillStyle = CCC.stall.color; ctx.fillRect(CCC.stall.x, CCC.stall.y, CCC.stall.width, CCC.stall.height);
            ctx.fillStyle = '#000'; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText("Cart", CCC.cart.x + CCC.cart.width/2, CCC.cart.y - 10);
            ctx.fillText("Stall", CCC.stall.x + CCC.stall.width/2, CCC.stall.y - 10);


            // Draw Obstacles
            CCC.obstacles.forEach(obs => {
                ctx.fillStyle = obs.color;
                if(obs.shape === 'circle') {
                    ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.width/2, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                }
            });
            
            // Draw Cabbage
            if (CCC.cabbage) {
                ctx.beginPath(); ctx.arc(CCC.cabbage.x, CCC.cabbage.y, CCC.cabbage.radius, 0, Math.PI * 2);
                ctx.fillStyle = CCC.cabbage.color; ctx.fill();
                ctx.strokeStyle = '#006400'; ctx.lineWidth = 2; ctx.stroke(); // Dark green outline
            }
        }
        function updateCabbageCartChaosScoreDisplay() {
            document.getElementById("cabbageCartChaos-score").textContent = `Delivered: ${CCC.cabbagesDelivered} / ${CCC.targetDeliveries} | Lost: ${CCC.cabbagesLost} / ${CCC.maxLost} | Best: ${getHighScore("cabbageCartChaos")}`;
        }

        // --- Spirit World Path ---
        const SWP = {};
        function initSpiritWorldPath() {
            const canvas = canvases.spiritWorldPath;
            SWP.targetPaths = 3;
            SWP.pathsCompleted = 0;
            SWP.nodes = [];
            SWP.nodeRadius = 15;
            SWP.connectedCount = 0;
            SWP.currentPath = []; // Stores points of the user's drawn path
            gameStates.spiritWorldPath.score = 0;
            generateNewSWPNodes();
            updateSpiritWorldPathScoreDisplay();
        }
        function generateNewSWPNodes() {
            if (SWP.pathsCompleted >= SWP.targetPaths) {
                gameStates.spiritWorldPath.gameOver = true;
                displayGameMessage('spiritWorldPath', `Enlightenment Reached!<br>All Paths Connected!`, 0, true);
                stopGame('spiritWorldPath');
                return;
            }
            SWP.nodes = [];
            SWP.connectedCount = 0;
            SWP.currentPath = [];
            const canvas = canvases.spiritWorldPath;
            const numNodes = Math.floor(Math.random() * 3) + 3; // 3 to 5 nodes

            for (let i = 0; i < numNodes; i++) {
                SWP.nodes.push({
                    x: Math.random() * (canvas.width * 0.8) + canvas.width * 0.1,
                    y: Math.random() * (canvas.height * 0.8) + canvas.height * 0.1,
                    radius: SWP.nodeRadius,
                    color: `hsl(${200 + i * 30}, 80%, 70%)`, // Blues/Purples
                    id: i, // Sequence ID
                    connected: false
                });
            }
        }
        function handleSpiritWorldPathLogic() { // Called during drag
            if (!globalDragState.isDragging || globalDragState.pathPoints.length < 1) return;
            
            const currentPoint = globalDragState.pathPoints[globalDragState.pathPoints.length - 1];
            const nextNodeToConnect = SWP.nodes[SWP.connectedCount];

            if (nextNodeToConnect && !nextNodeToConnect.connected) {
                if (Math.hypot(currentPoint.x - nextNodeToConnect.x, currentPoint.y - nextNodeToConnect.y) < nextNodeToConnect.radius) {
                    nextNodeToConnect.connected = true;
                    SWP.connectedCount++;
                    // Add node center to path for clean line
                    globalDragState.pathPoints.push({x: nextNodeToConnect.x, y: nextNodeToConnect.y}); 
                    
                    if (SWP.connectedCount === SWP.nodes.length) { // Path complete
                        SWP.pathsCompleted++;
                        gameStates.spiritWorldPath.score++;
                        displayGameMessage('spiritWorldPath', `Path ${SWP.pathsCompleted} Complete!`, 1500);
                        globalDragState.isDragging = false; // Stop current drag
                        globalDragState.pathPoints = [];
                        setTimeout(generateNewSWPNodes, 1600);
                    }
                }
            }
            updateSpiritWorldPathScoreDisplay();
        }
        function handleSpiritWorldPathDrop() {
            // Check if path is valid (e.g. didn't end prematurely)
            // For now, main logic is in handleSpiritWorldPathLogic during drag
            // If not all nodes connected, reset path attempt for this level
            if (SWP.connectedCount < SWP.nodes.length) {
                 displayGameMessage('spiritWorldPath', `Path Incomplete. Try Again!`, 1000);
                 SWP.nodes.forEach(n => n.connected = false); // Reset connected status for current nodes
                 SWP.connectedCount = 0;
            }
            globalDragState.pathPoints = []; // Clear path on drop
        }
        function updateSpiritWorldPath() { /* Most logic in drag handlers */ }
        function drawSpiritWorldPath() {
            const ctx = contexts.spiritWorldPath; const canvas = canvases.spiritWorldPath; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#4A235A'; // Deep purple spirit world bg
            // Create a radial gradient for a mystical effect
            const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2);
            gradient.addColorStop(0, 'rgba(74, 35, 90, 0.5)'); // Center color (semi-transparent)
            gradient.addColorStop(1, 'rgba(46, 24, 66, 1)');   // Outer color (opaque)
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);


            // Draw Nodes
            SWP.nodes.forEach((node, index) => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.connected ? '#00FF00' : (index === SWP.connectedCount ? '#FFFF00' : node.color); // Green if connected, Yellow for next, else default
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#000'; ctx.font = `${SWP.nodeRadius * 0.8}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(node.id + 1, node.x, node.y); // Display 1-based index
            });
            // Draw Current Path
            if (globalDragState.isDragging && globalDragState.pathPoints.length > 1) {
                ctx.beginPath();
                ctx.moveTo(globalDragState.pathPoints[0].x, globalDragState.pathPoints[0].y);
                for (let i = 1; i < globalDragState.pathPoints.length; i++) {
                    ctx.lineTo(globalDragState.pathPoints[i].x, globalDragState.pathPoints[i].y);
                }
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
            }
        }
        function updateSpiritWorldPathScoreDisplay() {
            const totalNodes = SWP.nodes ? SWP.nodes.length : 0;
            document.getElementById("spiritWorldPath-score").textContent = `Paths: ${SWP.pathsCompleted} / ${SWP.targetPaths} | Nodes: ${SWP.connectedCount} / ${totalNodes} | Best: ${getHighScore("spiritWorldPath")}`;
        }

        // --- Appa's Sky Journey ---
        const ASJ = {}; // Renamed from ASC
        function initAppasSkyJourney() {
            const canvas = canvases.appasSkyJourney;
            ASJ.appa = { x: canvas.width * 0.1, y: canvas.height / 2 - 20, width: 60, height: 40, color: '#D2B48C', tailLength: 20, tailSegments: 5 }; // Tan Appa
            ASJ.obstacles = []; ASJ.biscuits = []; ASJ.obstacleSpeed = 2.0; ASJ.biscuitSpeed = 1.5; ASJ.bgOffsetX = 0; ASJ.bgSpeed = 1;
            ASJ.spawnInterval = 1200; ASJ.biscuitSpawnInterval = 1800;
            ASJ.lastObstacleSpawn = 0; ASJ.lastBiscuitSpawn = 0;
            ASJ.hits = 0; ASJ.maxHits = 3; ASJ.biscuitsCollected = 0; ASJ.targetBiscuits = 15;
            ASJ.gameTime = 0; ASJ.targetTime = 60; ASJ.startTime = Date.now();
            gameStates.appasSkyJourney.score = 0;
            updateAppasSkyJourneyScoreDisplay();
        }
        function updateAppasSkyJourney() {
            if (gameStates.appasSkyJourney.gameOver) return;
            const canvas = canvases.appasSkyJourney; const now = Date.now();
            ASJ.gameTime = Math.floor((now - ASJ.startTime) / 1000);
            ASJ.bgOffsetX = (ASJ.bgOffsetX - ASJ.bgSpeed) % canvas.width; // Background scroll

            // Spawn Obstacles (Fire Nation Ships)
            if (now - ASJ.lastObstacleSpawn > ASJ.spawnInterval) {
                ASJ.obstacles.push({ x: canvas.width + 50, y: Math.random() * (canvas.height - 40), width: 50, height: 30, color: '#701C1C' }); // Dark red
                ASJ.lastObstacleSpawn = now;
            }
            // Spawn Biscuits
            if (now - ASJ.lastBiscuitSpawn > ASJ.biscuitSpawnInterval) {
                ASJ.biscuits.push({ x: canvas.width + 30, y: Math.random() * (canvas.height - 20), radius: 10, color: '#C19A6B' }); // Biscuit color
                ASJ.lastBiscuitSpawn = now;
            }

            // Move Obstacles & Biscuits
            [ASJ.obstacles, ASJ.biscuits].forEach((itemList, typeIndex) => {
                const speed = typeIndex === 0 ? ASJ.obstacleSpeed : ASJ.biscuitSpeed;
                for (let i = itemList.length - 1; i >= 0; i--) {
                    const item = itemList[i]; item.x -= speed;
                    if (item.x < -item.width || item.x < -item.radius) { itemList.splice(i, 1); continue; }
                    // Collision with Appa
                    let collision = false;
                    if (typeIndex === 0) { // Obstacle (rect)
                        collision = item.x < ASJ.appa.x + ASJ.appa.width && item.x + item.width > ASJ.appa.x &&
                                    item.y < ASJ.appa.y + ASJ.appa.height && item.y + item.height > ASJ.appa.y;
                    } else { // Biscuit (circle)
                        collision = Math.hypot((item.x) - (ASJ.appa.x + ASJ.appa.width/2), (item.y) - (ASJ.appa.y + ASJ.appa.height/2)) < item.radius + Math.min(ASJ.appa.width, ASJ.appa.height)/2;
                    }
                    if (collision) {
                        itemList.splice(i, 1);
                        if (typeIndex === 0) { // Obstacle
                            ASJ.hits++; displayGameMessage('appasSkyJourney', `Hit! Careful!`, 500);
                            if (ASJ.hits >= ASJ.maxHits) { gameStates.appasSkyJourney.gameOver = true; displayGameMessage('appasSkyJourney', `Game Over!<br>Appa is tired!`, 0, true); stopGame('appasSkyJourney'); }
                        } else { // Biscuit
                            ASJ.biscuitsCollected++; gameStates.appasSkyJourney.score++;
                        }
                    }
                }
            });
            if (!gameStates.appasSkyJourney.gameOver && (ASJ.gameTime >= ASJ.targetTime || ASJ.biscuitsCollected >= ASJ.targetBiscuits)) {
                gameStates.appasSkyJourney.gameOver = true;
                displayGameMessage('appasSkyJourney', `Great Journey!<br>Biscuits: ${ASJ.biscuitsCollected}, Time: ${ASJ.gameTime}s`, 0, true);
                stopGame('appasSkyJourney');
            }
            updateAppasSkyJourneyScoreDisplay();
        }
        function drawAppasSkyJourney() {
            const ctx = contexts.appasSkyJourney; const canvas = canvases.appasSkyJourney; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Scrolling Background (Clouds)
            ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let i = 0; i < 5; i++) { // Draw a few clouds
                const cloudX = (ASJ.bgOffsetX + i * (canvas.width / 3)) % canvas.width;
                const cloudY = (i % 2 === 0 ? canvas.height * 0.2 : canvas.height * 0.6) + Math.sin(ASJ.bgOffsetX * 0.01 + i) * 20;
                ctx.beginPath(); ctx.ellipse(cloudX, cloudY, 60, 30, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cloudX + 30, cloudY - 10, 50, 25, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cloudX - 20, cloudY + 5, 55, 28, 0, 0, Math.PI * 2); ctx.fill();
            }

            // Draw Appa
            const ax = ASJ.appa.x; const ay = ASJ.appa.y; const aw = ASJ.appa.width; const ah = ASJ.appa.height;
            ctx.fillStyle = ASJ.appa.color;
            // Body
            ctx.beginPath(); ctx.ellipse(ax + aw/2, ay + ah/2, aw/2, ah/2, 0, 0, Math.PI*2); ctx.fill();
            // Head (smaller ellipse at front)
            ctx.beginPath(); ctx.ellipse(ax + aw * 0.8, ay + ah/2, aw/3, ah/3, 0, 0, Math.PI*2); ctx.fill();
            // Legs (simple stubs)
            ctx.fillRect(ax + aw*0.2, ay + ah*0.8, 10, 10); ctx.fillRect(ax + aw*0.6, ay + ah*0.8, 10, 10);
            // Tail
            ctx.beginPath(); ctx.moveTo(ax, ay + ah/2);
            for(let i=1; i <= ASJ.appa.tailSegments; i++) {
                const tx = ax - (ASJ.appa.tailLength / ASJ.appa.tailSegments) * i;
                const ty = ay + ah/2 + Math.sin(i*0.5 + Date.now()*0.01) * 5 * (1 - i/ASJ.appa.tailSegments); // Waving tail
                const tailWidth = (ah/3) * (1 - i/(ASJ.appa.tailSegments + 1));
                ctx.lineTo(tx, ty - tailWidth/2);
                ctx.lineTo(tx, ty + tailWidth/2);
            }
            ctx.lineTo(ax - ASJ.appa.tailLength, ay + ah/2); // Tip of tail
            ctx.closePath(); ctx.fill();
            // Brown arrow on Appa's back
            ctx.fillStyle = '#8B4513'; 
            ctx.beginPath(); ctx.moveTo(ax + aw/2, ay + ah*0.2); ctx.lineTo(ax + aw*0.3, ay + ah*0.5); ctx.lineTo(ax + aw*0.7, ay + ah*0.5); ctx.closePath(); ctx.fill();


            ASJ.obstacles.forEach(obs => { // Fire Nation Ships
                ctx.fillStyle = obs.color; 
                ctx.beginPath(); ctx.moveTo(obs.x, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height/2); ctx.lineTo(obs.x, obs.y + obs.height); ctx.closePath(); ctx.fill();
            });
            ASJ.biscuits.forEach(bisc => { 
                ctx.fillStyle = bisc.color; ctx.beginPath(); ctx.arc(bisc.x, bisc.y, bisc.radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8B5A2B';
                for(let k=0; k<3; k++) { ctx.beginPath(); ctx.arc(bisc.x + (Math.random()-0.5)*bisc.radius*0.7, bisc.y + (Math.random()-0.5)*bisc.radius*0.7, 1.5, 0, Math.PI*2); ctx.fill(); }
            });
        }
        function updateAppasSkyJourneyScoreDisplay() {
            document.getElementById("appasSkyJourney-score").textContent = `Biscuits: ${ASJ.biscuitsCollected} / ${ASJ.targetBiscuits} | Hits: ${ASJ.hits} / ${ASJ.maxHits} | Time: ${ASJ.gameTime}s | Best: ${getHighScore("appasSkyJourney")}`;
        }

        // --- Momo Fruit Catch ---
        const MFC = {};
        function initMomoFruitCatch() {
            const canvas = canvases.momoFruitCatch;
            MFC.momo = { x: canvas.width / 2 - 20, y: canvas.height - 50, width: 40, height: 40, color: '#F5CBA7' };
            MFC.fruits = [];
            MFC.spawnInterval = 1200;
            MFC.lastSpawn = 0;
            MFC.fruitSpeed = 2;
            MFC.fruitsCaught = 0;
            MFC.targetFruits = 10;
            MFC.missed = 0;
            MFC.maxMissed = 3;
            gameStates.momoFruitCatch.score = 0;
            updateMomoFruitCatchScoreDisplay();
        }
        function updateMomoFruitCatch() {
            if (gameStates.momoFruitCatch.gameOver) return;
            const canvas = canvases.momoFruitCatch; const now = Date.now();
            if (now - MFC.lastSpawn > MFC.spawnInterval) {
                MFC.fruits.push({ x: Math.random() * (canvas.width - 20) + 10, y: -20, radius: 10, color: '#FF6347' });
                MFC.lastSpawn = now;
            }
            for (let i = MFC.fruits.length - 1; i >= 0; i--) {
                const f = MFC.fruits[i];
                f.y += MFC.fruitSpeed;
                if (f.y > canvas.height + f.radius) {
                    MFC.fruits.splice(i, 1);
                    MFC.missed++;
                    if (MFC.missed >= MFC.maxMissed) {
                        gameStates.momoFruitCatch.gameOver = true;
                        displayGameMessage('momoFruitCatch', `Too Many Missed!<br>Game Over!`);
                        stopGame('momoFruitCatch');
                    }
                    continue;
                }
                if (f.x > MFC.momo.x && f.x < MFC.momo.x + MFC.momo.width && f.y + f.radius > MFC.momo.y && f.y - f.radius < MFC.momo.y + MFC.momo.height) {
                    MFC.fruits.splice(i, 1);
                    MFC.fruitsCaught++; gameStates.momoFruitCatch.score++;
                    if (MFC.fruitsCaught >= MFC.targetFruits) {
                        gameStates.momoFruitCatch.gameOver = true;
                        displayGameMessage('momoFruitCatch', `Great Job!<br>Fruits: ${MFC.fruitsCaught}`);
                        stopGame('momoFruitCatch');
                    }
                }
            }
            updateMomoFruitCatchScoreDisplay();
        }
        function drawMomoFruitCatch() {
            const ctx = contexts.momoFruitCatch; const canvas = canvases.momoFruitCatch; if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = MFC.momo.color;
            ctx.fillRect(MFC.momo.x, MFC.momo.y, MFC.momo.width, MFC.momo.height);
            MFC.fruits.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill(); });
        }
        function updateMomoFruitCatchScoreDisplay() {
            document.getElementById("momoFruitCatch-score").textContent = `Fruits: ${MFC.fruitsCaught} / ${MFC.targetFruits} | Missed: ${MFC.missed} / ${MFC.maxMissed} | Best: ${getHighScore("momoFruitCatch")}`;
        }

        // --- Window Resize Handling ---
        window.addEventListener('resize', () => {
            gameIds.forEach(id => {
                const canvas = canvases[id]; const gameView = gameContainers[id];
                if (canvas && contexts[id] && gameView && !gameView.classList.contains('hidden')) {
                    const wasRunning = gameStates[id].running; const wasGameOver = gameStates[id].gameOver;
                    const currentMessage = messageOverlays[id] ? messageOverlays[id].innerHTML : "";
                    const messageHidden = messageOverlays[id] ? messageOverlays[id].classList.contains('hidden') : true;
                    stopGame(id); resizeCanvas(canvas);
                    if (gameStates[id].initialized) {
                        switch (id) { 
                            case 'elementalBending': initElementalBending(); drawElementalBending(); break;
                            case 'sunflowerBloom': initSunflowerBloom(); drawSunflowerBloom(); break;
                            case 'cabbageCartChaos': initCabbageCartChaos(); drawCabbageCartChaos(); break;
                            case 'spiritWorldPath': initSpiritWorldPath(); drawSpiritWorldPath(); break; 
                            case 'appasSkyJourney': initAppasSkyJourney(); drawAppasSkyJourney(); break;
                            case 'momoFruitCatch': initMomoFruitCatch(); drawMomoFruitCatch(); break;
                            default: drawInitialCanvasState(id);
                        }
                         if (wasGameOver) {
                            gameStates[id].gameOver = true; if(!messageHidden) displayGameMessage(id, currentMessage); stopGame(id); 
                         } else if (wasRunning) { gameStates[id].running = true; gameLoop(id); }
                    }
                }
            });
        });
        showHub(); 

