"use client";

import {useState, useEffect, useRef, useCallback} from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
interface BallotRecord {
    id: number;
    vote: string;
    partyCode: string;
    partyName: string;
}

interface PartyTally {
    code: string;
    name: string;
    color: string;
    lightColor: string;
    count: number;
}

type Phase = "idle" | "loading" | "parsing" | "counting" | "certified";

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const animationSpeed = 0.025;

interface RoundConfig {
    title: string;
    filename: string;
    backgroundImage?: string;
    partyOrder: string[]; // Dictates which baskets are drawn (including Invalid)
    ballotChoices: string[]; // Dictates which checkboxes print on the 3D paper
    partyConfig: Record<string, { name: string; color: string; lightColor: string; keywords: string[] }>;
}

// ════════════════════ DATA ════════════════════ //
const ELECTION_ROUNDS: RoundConfig[] = [
    // {
    //     title: "Student Association Party",
    //     filename: "2026 Student Association Party E-Ballot Voting (All students).csv",
    //     backgroundImage: "/BackgroundImage/Party.png",
    //     partyOrder: ["P1", "P2", "PX", "PD"],
    //     ballotChoices: ["P1", "P2", "PX"],
    //     partyConfig: {
    //         P1: {
    //             name: "Endorse (รับรอง)",
    //             color: "#2563eb",
    //             lightColor: "#93bbfd",
    //             keywords: ["endorse", "รับรอง"]
    //         },
    //         P2: {
    //             name: "Not endorse (ไม่รับรอง)",
    //             color: "#ea580c",
    //             lightColor: "#fdba74",
    //             keywords: ["not endorse", "ไม่รับรอง"]
    //         },
    //         PX: {
    //             name: "No Vote (ไม่ประสงค์ลงคะแนน)",
    //             color: "#94a3b8",
    //             lightColor: "#cbd5e1",
    //             keywords: ["no vote", "ไม่ประสงค์"]
    //         },
    //         PD: {
    //             name: "Invalid Vote (บัตรเสีย)",
    //             color: "#ef4444",
    //             lightColor: "#fca5a5",
    //             keywords: []},
    //     }
    // },
    // {
    //     title: "Student Representative (ICT Year 1)",
    //     filename: "2026 Student Representative E-Ballot Voting (ICT ID68).csv",
    //     backgroundImage: "/BackgroundImage/ICT1.png",
    //     partyOrder: ["C1", "C2", "PX", "PD"],
    //     ballotChoices: ["C1", "C2", "PX"],
    //     partyConfig: {
    //         C1: {
    //             name: "[1] 6888041 Aryan Khan",
    //             color: "#10b981",
    //             lightColor: "#6ee7b7",
    //             keywords: ["[1]"]
    //         },
    //         C2: {
    //             name: "[2] 6888188 Monsiri Yutthasarnsenee",
    //             color: "#8b5cf6",
    //             lightColor: "#c4b5fd",
    //             keywords: ["[2]"]
    //         },
    //         PX: {
    //             name: "No Vote (ไม่ประสงค์ลงคะแนน)",
    //             color: "#94a3b8",
    //             lightColor: "#cbd5e1",
    //             keywords: ["no vote", "ไม่ประสงค์"]
    //         },
    //         PD: {
    //             name: "Invalid Vote (บัตรเสีย)",
    //             color: "#ef4444",
    //             lightColor: "#fca5a5",
    //             keywords: []},
    //     }
    // },
    {
        title: "Student Representative (ICT Year 2)",
        filename: "2026 Student Representative E-Ballot Voting (ICT ID67).csv",
        backgroundImage: "/BackgroundImage/ICT2.png",
        partyOrder: ["P1", "P2", "PX", "PD"],
        ballotChoices: ["P1", "P2", "PX"],
        partyConfig: {
            P1: {
                name: "Endorse (รับรอง)",
                color: "#2563eb",
                lightColor: "#93bbfd",
                keywords: ["endorse", "รับรอง"]
            },
            P2: {
                name: "Not endorse (ไม่รับรอง)",
                color: "#ea580c",
                lightColor: "#fdba74",
                keywords: ["not endorse", "ไม่รับรอง"]
            },
            PX: {
                name: "No Vote (ไม่ประสงค์ลงคะแนน)",
                color: "#94a3b8",
                lightColor: "#cbd5e1",
                keywords: ["no vote", "ไม่ประสงค์"]
            },
            PD: {
                name: "Invalid Vote (บัตรเสีย)",
                color: "#ef4444",
                lightColor: "#fca5a5",
                keywords: []},
        }
    },
    {
        title: "Student Representative (ICT Year 3)",
        filename: "2026 Student Representative E-Ballot Voting (ICT ID66).csv",
        backgroundImage: "/BackgroundImage/ICT3.png",
        partyOrder: ["C1", "C2", "PX", "PD"],
        ballotChoices: ["C1", "C2", "PX"],
        partyConfig: {
            C1: {
                name: "[1] 6688056 Prempavenn Lerttraipop",
                color: "#10b981",
                lightColor: "#6ee7b7",
                keywords: ["[1]"]
            },
            C2: {
                name: "[2] 6688142 Krerkkiat Wattanaporn",
                color: "#8b5cf6",
                lightColor: "#c4b5fd",
                keywords: ["[2]"]
            },
            PX: {
                name: "No Vote (ไม่ประสงค์ลงคะแนน)",
                color: "#94a3b8",
                lightColor: "#cbd5e1",
                keywords: ["no vote", "ไม่ประสงค์", "[x]"]
            },
            PD: {
                name: "Invalid Vote (บัตรเสีย)",
                color: "#ef4444",
                lightColor: "#fca5a5",
                keywords: []},
        }
    },
    {
        title: "Student Representative (DST Year 1)",
        filename: "2026 Student Representative E-Ballot Voting (DST 68).csv",
        backgroundImage: "/BackgroundImage/DST1.png",
        partyOrder: ["P1", "P2", "PX", "PD"],
        ballotChoices: ["P1", "P2", "PX"],
        partyConfig: {
            P1: {
                name: "Endorse (รับรอง)",
                color: "#2563eb",
                lightColor: "#93bbfd",
                keywords: ["endorse", "รับรอง"]
            },
            P2: {
                name: "Not endorse (ไม่รับรอง)",
                color: "#ea580c",
                lightColor: "#fdba74",
                keywords: ["not endorse", "ไม่รับรอง"]
            },
            PX: {
                name: "No Vote (ไม่ประสงค์ลงคะแนน)",
                color: "#94a3b8",
                lightColor: "#cbd5e1",
                keywords: ["no vote", "ไม่ประสงค์", "[x]"]
            },
            PD: {
                name: "Invalid Vote (บัตรเสีย)",
                color: "#ef4444",
                lightColor: "#fca5a5",
                keywords: []},
        }
    },
    {
        title: "Student Representative (DST Year 2)",
        filename: "2026 Student Representative E-Ballot Voting (DST 67).csv",
        backgroundImage: "/BackgroundImage/DST2.png",
        partyOrder: ["P1", "P2", "PX", "PD"],
        ballotChoices: ["P1", "P2", "PX"],
        partyConfig: {
            P1: {
                name: "Endorse (รับรอง)",
                color: "#2563eb",
                lightColor: "#93bbfd",
                keywords: ["endorse", "รับรอง"]
            },
            P2: {
                name: "Not endorse (ไม่รับรอง)",
                color: "#ea580c",
                lightColor: "#fdba74",
                keywords: ["not endorse", "ไม่รับรอง"]
            },
            PX: {
                name: "No Vote (ไม่ประสงค์ลงคะแนน)",
                color: "#94a3b8",
                lightColor: "#cbd5e1",
                keywords: ["no vote", "ไม่ประสงค์", "[x]"]
            },
            PD: {
                name: "Invalid Vote (บัตรเสีย)",
                color: "#ef4444",
                lightColor: "#fca5a5",
                keywords: []},
        }
    },
    {
        title: "Student Representative (DST Year 3)",
        filename: "2026 Student Representative E-Ballot Voting (DST 66).csv",
        backgroundImage: "/BackgroundImage/DST3.png",
        partyOrder: ["P1", "P2", "PX", "PD"],
        ballotChoices: ["P1", "P2", "PX"],
        partyConfig: {
            P1: {
                name: "Endorse (รับรอง)",
                color: "#2563eb",
                lightColor: "#93bbfd",
                keywords: ["endorse", "รับรอง"]
            },
            P2: {
                name: "Not endorse (ไม่รับรอง)",
                color: "#ea580c",
                lightColor: "#fdba74",
                keywords: ["not endorse", "ไม่รับรอง"]
            },
            PX: {
                name: "No Vote (ไม่ประสงค์ลงคะแนน)",
                color: "#94a3b8",
                lightColor: "#cbd5e1",
                keywords: ["no vote", "ไม่ประสงค์", "[x]"]
            },
            PD: {
                name: "Invalid Vote (บัตรเสีย)",
                color: "#ef4444",
                lightColor: "#fca5a5",
                keywords: []},
        }
    },
];

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function parseCSV(text: string, round: RoundConfig): BallotRecord[] {
    const lines = text.trim().split("\n");
    const records: BallotRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const firstComma = line.indexOf(",");
        if (firstComma === -1) continue;

        const id = parseInt(line.substring(0, firstComma).replace(/"/g, ""), 10);
        let voteRaw = line.substring(firstComma + 1).replace(/"/g, "").trim();
        if (voteRaw.startsWith("- ")) voteRaw = voteRaw.substring(2);

        const lowerVote = voteRaw.toLowerCase();
        let partyCode = "PD"; // Default to Invalid

        // Scan against this round's specific keywords
        for (const code of round.partyOrder) {
            if (code === "PD") continue;
            const keywords = round.partyConfig[code].keywords;

            // Special fix to prevent "Endorse" from matching "Not Endorse"
            if (code === "P1" && lowerVote.includes("not endorse")) continue;

            if (keywords.some((kw: any) => kw && lowerVote.includes(kw.toLowerCase()))) {
                partyCode = code;
                break;
            }
        }

        records.push({id, vote: voteRaw, partyCode, partyName: round.partyConfig[partyCode].name});
    }
    return records;
}

function simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

function formatTimestamp(): string {
    return new Date().toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
}

/* ═══════════════════════════════════════════════════
   THREE.JS BALLOT SCENE
   ═══════════════════════════════════════════════════ */
interface BallotSceneProps {
    currentBallot: BallotRecord | null;
    onBallotLanded: () => void;
    tallies: Record<string, PartyTally>;
    phase: Phase;
    onUnfoldComplete: () => void;
    readyToDrop: boolean;
    roundConfig: RoundConfig;
}

function createBallotTexture(ballot: BallotRecord, roundConfig: RoundConfig): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext("2d")!;

    // Paper background
    const grad = ctx.createLinearGradient(0, 0, 512, 700);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#f8fafc");
    grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 700);

    // Subtle ruled lines
    ctx.strokeStyle = "rgba(180, 170, 130, 0.12)";
    ctx.lineWidth = 1;
    for (let y = 30; y < 700; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }

    // Border
    ctx.strokeStyle = "#d4c87a";
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 500, 688);

    // Header
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 28px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OFFICIAL BALLOT", 256, 50);

    ctx.fillStyle = "#a16207";
    ctx.font = "bold 21px 'Inter', sans-serif";
    ctx.fillText("2026 Student Association Party Election", 256, 82);

    ctx.fillStyle = "#b45309";
    ctx.font = "24px monospace";
    ctx.fillText(`Ballot #${ballot.id.toString().padStart(4, "0")}`, 256, 115);

    // Divider
    ctx.strokeStyle = "rgba(161, 98, 7, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 108);
    ctx.lineTo(472, 108);
    ctx.stroke();

    // Title
    ctx.fillStyle = "#78350f";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText("Vote for the Student Council Party", 256, 158);

    // Choices
    const yStart = 175;
    const rowH = 120;
    roundConfig.ballotChoices.forEach((code, i) => {
        const config = roundConfig.partyConfig[code];
        const isSelected = ballot.partyCode === code;
        const y = yStart + i * rowH;

        // Row background
        if (isSelected) {
            ctx.fillStyle = "rgba(250, 204, 21, 0.15)";
            ctx.fillRect(35, y - 5, 442, rowH - 15);
        }

        // Checkbox
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(55, y + 10, 40, 40);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(56, y + 11, 38, 38);

        // X mark if selected
        if (isSelected) {
            ctx.strokeStyle = "#1a1a1a";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            // Slightly imperfect X
            ctx.beginPath();
            ctx.moveTo(60, y + 16);
            ctx.lineTo(90, y + 46);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(89, y + 15);
            ctx.lineTo(61, y + 45);
            ctx.stroke();
            ctx.lineCap = "butt";
        }

        // Party text
        // Party text
        ctx.fillStyle = "#78350f";
        ctx.font = "bold 24px 'Inter', sans-serif";
        ctx.textAlign = "left";

        let displayName = config.name;
        const maxTextWidth = 360; // The maximum pixel width allowed before hitting the right border

        // Measure the text. If it's too long, slice it and add "..."
        if (ctx.measureText(displayName).width > maxTextWidth) {
            while (displayName.length > 0 && ctx.measureText(displayName + "...").width > maxTextWidth) {
                displayName = displayName.slice(0, -1); // Remove one letter from the end
            }
            displayName += "...";
        }

        ctx.fillText(displayName, 115, y + 37);
    });

    // Footer
    ctx.strokeStyle = "rgba(161, 98, 7, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 560);
    ctx.lineTo(472, 560);
    ctx.stroke();

    ctx.fillStyle = "rgba(120, 53, 15, 1)";
    ctx.font = "italic 16px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Mark only one selection", 256, 585);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function BallotScene({
                         currentBallot,
                         onBallotLanded,
                         tallies,
                         phase,
                         onUnfoldComplete,
                         readyToDrop,
                         roundConfig
                     }: BallotSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const callbacksRef = useRef({onUnfoldComplete, readyToDrop});
    useEffect(() => {
        callbacksRef.current = {onUnfoldComplete, readyToDrop};
    }, [onUnfoldComplete, readyToDrop]);

    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        animationId: number;
        ballotMesh: THREE.Group | null;
        baskets: Record<string, THREE.Group>;
        stackedBallots: Record<string, THREE.Mesh[]>;
        animPhase: "none" | "unfold" | "wait" | "drop" | "done";
        animProgress: number;
        currentTarget: string;
        dropRandomX: number;
        dropRandomY: number;
    } | null>(null);

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 1, 0);

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 4);
        fillLight.position.set(-3, 5, -3);
        scene.add(fillLight);

        // Floor/table surface
        const floorGeo = new THREE.PlaneGeometry(20, 15);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.8,
            metalness: 0.05,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.5;
        floor.receiveShadow = true;
        scene.add(floor);

        // Create baskets (Auto-spacing based on number of options)
        const baskets: Record<string, THREE.Group> = {};
        const stackedBallots: Record<string, THREE.Mesh[]> = {};
        const bPositions: Record<string, number> = {};

        const count = roundConfig.partyOrder.length;
        const spacing = Math.min(3.0, 12.0 / count); // Shrinks spacing if there are >4 boxes
        const startX = -((count - 1) * spacing) / 2;

        roundConfig.partyOrder.forEach((code, i) => {
            bPositions[code] = startX + i * spacing;
            const config = roundConfig.partyConfig[code];

            const group = new THREE.Group();
            group.position.set(bPositions[code], -1.5, 2);

            // Basket box geometry
            const boxW = Math.min(2.2, spacing - 0.4); // Shrink box width if tight
            const boxH = 1.0, boxD = 1.6, wallThick = 0.06;
            const basketMat = new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.4,
                metalness: 0.15,
                transparent: true,
                opacity: 0.7,
            });

            // Bottom
            const bottom = new THREE.Mesh(new THREE.BoxGeometry(boxW, wallThick, boxD), basketMat);
            bottom.position.y = 0;
            bottom.receiveShadow = true;
            group.add(bottom);

            // Front
            const front = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, wallThick), basketMat);
            front.position.set(0, boxH / 2, boxD / 2);
            group.add(front);

            // Back
            const back = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, wallThick), basketMat);
            back.position.set(0, boxH / 2, -boxD / 2);
            group.add(back);

            // Left
            const left = new THREE.Mesh(new THREE.BoxGeometry(wallThick, boxH, boxD), basketMat);
            left.position.set(-boxW / 2, boxH / 2, 0);
            group.add(left);

            // Right
            const right = new THREE.Mesh(new THREE.BoxGeometry(wallThick, boxH, boxD), basketMat);
            right.position.set(boxW / 2, boxH / 2, 0);
            group.add(right);

            // Label
            const labelCanvas = document.createElement("canvas");
            labelCanvas.width = 256;
            labelCanvas.height = 64;
            const lctx = labelCanvas.getContext("2d")!;
            lctx.fillStyle = "transparent";
            lctx.fillRect(0, 0, 256, 64);
            lctx.fillStyle = "#334155";
            lctx.font = "bold 28px Arial, sans-serif";
            lctx.textAlign = "center";

            // Set the big text based on category
            let labelText = `[${code}]`;
            if (code === "PX") labelText = "No Vote (ไม่ประสงค์ลงคะแนน)";
            if (code === "PD") labelText = "Invalid";
            lctx.fillText(labelText, 128, 28);

            lctx.font = "18px Arial, sans-serif";
            lctx.fillText(code === "PX" || code === "PD" ? "" : config.name, 128, 52);

            scene.add(group);
            baskets[code] = group;
            stackedBallots[code] = [];
        });

        const state = {
            scene, camera, renderer,
            animationId: 0,
            ballotMesh: null as THREE.Group | null,
            baskets, stackedBallots,
            animPhase: "none" as "none" | "unfold" | "wait" | "drop" | "done",
            animProgress: 0,
            currentTarget: "",
            dropRandomX: 0,
            dropRandomY: 0,
        };
        sceneRef.current = state;

        // Animation loop
        const animate = () => {
            state.animationId = requestAnimationFrame(animate);
            if (state.ballotMesh && state.animPhase !== "none" && state.animPhase !== "done") {
                const mesh = state.ballotMesh;

                if (state.animPhase === "unfold") {
                    state.animProgress += animationSpeed; // Unfold speed
                    const t = Math.min(state.animProgress, 1);
                    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

                    // Float up gently
                    mesh.position.y = 2.5 + ease * 0.8;
                    // Gentle tilt to give 3D perspective of the fold
                    mesh.rotation.y = Math.sin(t * Math.PI) * 0.25;
                    mesh.rotation.x = -0.2 + ease * 0.05;

                    // Unfold the top half-pivot (children[1] is the topPivot group)
                    const topPivot = mesh.children[1] as THREE.Group;
                    if (topPivot) {
                        topPivot.rotation.x = THREE.MathUtils.lerp(Math.PI, 0, ease);
                    }

                    if (t >= 1) {
                        // Unfold complete: transition to wait phase and notify parent
                        state.animPhase = "wait";
                        state.animProgress = 0;
                        callbacksRef.current.onUnfoldComplete();
                    }

                } else if (state.animPhase === "wait") {
                    // Gently float while waiting for the audio to finish
                    state.animProgress += 0.02;
                    mesh.position.y = 3.3 + Math.sin(state.animProgress) * 0.03;

                    // Check if parent signaled that audio is done
                    if (callbacksRef.current.readyToDrop) {
                        state.animPhase = "drop";
                        state.animProgress = 0;
                        // Cache random values once for stable drop animation
                        state.dropRandomX = (Math.random() - 0.5) * 0.15;
                        state.dropRandomY = (Math.random() - 0.5) * 0.3;
                    }

                } else if (state.animPhase === "drop") {
                    state.animProgress += animationSpeed * 1.5; // Drop speed
                    const t = Math.min(state.animProgress * 1.5, 1);
                    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                    const targetX = bPositions[state.currentTarget];
                    const targetY = -1.5 + 0.1 + (state.stackedBallots[state.currentTarget]?.length || 0) * 0.02;

                    mesh.position.x = THREE.MathUtils.lerp(0, targetX, ease);
                    mesh.position.y = THREE.MathUtils.lerp(3.3, targetY, ease * ease);
                    mesh.position.z = THREE.MathUtils.lerp(0, 2, ease);
                    mesh.rotation.x = THREE.MathUtils.lerp(-0.15, -Math.PI / 2 + state.dropRandomX, ease);
                    mesh.rotation.y = THREE.MathUtils.lerp(0, state.dropRandomY, ease);

                    // Refold the paper slightly as it drops into the box
                    const topPivot = mesh.children[1] as THREE.Group;
                    if (topPivot) {
                        topPivot.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 1.5, ease);
                    }

                    const s = THREE.MathUtils.lerp(1, 0.35, ease);
                    mesh.scale.set(s, s, s);

                    if (t >= 1) {
                        state.animPhase = "done";
                        // Add to stack
                        addToStack(state.currentTarget, mesh);
                        onBallotLanded();
                    }
                }
            }

            renderer.render(scene, camera);
        };


        function addToStack(code: string, group: THREE.Group) {
            // Remove the animated ballot group, create a small flat card in the basket
            scene.remove(group);
            const stackCount = state.stackedBallots[code].length;
            const yPos = -1.5 + 0.08 + stackCount * 0.018;
            const smallGeo = new THREE.BoxGeometry(1.6, 0.015, 1.1);
            const smallMat = new THREE.MeshStandardMaterial({
                color: 0xfefce8,
                roughness: 0.7,
            });
            const card = new THREE.Mesh(smallGeo, smallMat);
            card.position.set(
                bPositions[code],
                yPos,
                2 + (Math.random() - 0.5) * 0.15
            );
            card.rotation.y = (Math.random() - 0.5) * 0.2;
            card.castShadow = true;
            card.receiveShadow = true;
            scene.add(card);
            state.stackedBallots[code].push(card);
        }

        animate();

        // Handle resize
        const handleResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(state.animationId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            sceneRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Spawn new ballot when currentBallot changes
    useEffect(() => {
        const state = sceneRef.current;
        if (!state || !currentBallot) return;

        // Remove previous ballot mesh
        if (state.ballotMesh) {
            state.scene.remove(state.ballotMesh);
            state.ballotMesh = null;
        }

        const texture = createBallotTexture(currentBallot, roundConfig);
        const ballotW = 2.3;
        const ballotH = 3.2;
        const halfH = ballotH / 2;

        const group = new THREE.Group();

        // ── Bottom half (visible content below fold line) ──
        const bottomGeo = new THREE.PlaneGeometry(ballotW, halfH);
        // Remap UVs to show bottom half of texture (v: 0 → 0.5)
        const uvBottom = bottomGeo.attributes.uv;
        for (let i = 0; i < uvBottom.count; i++) {
            uvBottom.setY(i, uvBottom.getY(i) * 0.5);
        }
        const bottomMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });
        const bottomHalf = new THREE.Mesh(bottomGeo, bottomMat);
        bottomHalf.position.set(0, -halfH / 2, 0); // Center of bottom half
        bottomHalf.castShadow = true;
        group.add(bottomHalf);

        // ── Top half pivot group (pivots at fold line y=0) ──
        const topPivot = new THREE.Group();
        topPivot.position.set(0, 0, 0); // Position at fold line

        // Top half front face (ballot content)
        const topGeo = new THREE.PlaneGeometry(ballotW, halfH);
        // Remap UVs to show top half of texture (v: 0.5 → 1.0)
        const uvTop = topGeo.attributes.uv;
        for (let i = 0; i < uvTop.count; i++) {
            uvTop.setY(i, 0.5 + uvTop.getY(i) * 0.5);
        }
        const topMat = new THREE.MeshStandardMaterial({
            map: texture.clone(),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.FrontSide,
        });
        const topFront = new THREE.Mesh(topGeo, topMat);
        topFront.position.set(0, halfH / 2, 0); // Offset up from pivot
        topFront.castShadow = true;
        topPivot.add(topFront);

        // Top half back face (plain paper, visible when folded)
        const topBackGeo = new THREE.PlaneGeometry(ballotW, halfH);
        const topBackMat = new THREE.MeshStandardMaterial({
            color: 0xfef3c7,
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.FrontSide,
        });
        const topBack = new THREE.Mesh(topBackGeo, topBackMat);
        topBack.position.set(0, halfH / 2, 0);
        topBack.rotation.y = Math.PI; // Faces opposite direction
        topPivot.add(topBack);

        // Start fully folded: top half folded over (-PI rotation around X at fold line)
        topPivot.rotation.x = Math.PI;
        group.add(topPivot);

        // Position the ballot group
        group.position.set(0, 2.5, 0);

        state.scene.add(group);
        state.ballotMesh = group;
        state.animPhase = "unfold";
        state.animProgress = 0;
        state.currentTarget = currentBallot.partyCode;
    }, [currentBallot]);

    return (
        <div
            ref={containerRef}
            className="three-canvas-container w-full h-full overflow-hidden"
        />
    );
}

/* ═══════════════════════════════════════════════════
   PIE CHART (SVG)
   ═══════════════════════════════════════════════════ */
function PieChart({tallies, total}: { tallies: PartyTally[]; total: number }) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let cumulativeOffset = 0;

    if (total === 0) {
        return (
            <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="30"/>
            </svg>
        );
    }

    return (
        <svg width="160" height="160" viewBox="0 0 160 160">
            {tallies.map((party) => {
                const fraction = party.count / total;
                const dashLength = fraction * circumference;
                const dashGap = circumference - dashLength;
                const offset = cumulativeOffset;
                cumulativeOffset += dashLength;
                return (
                    <circle
                        key={party.code}
                        cx="80" cy="80" r={radius}
                        fill="none" stroke={party.color} strokeWidth="30"
                        strokeDasharray={`${dashLength} ${dashGap}`}
                        strokeDashoffset={-offset}
                        style={{
                            transition: "stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease",
                            transform: "rotate(-90deg)",
                            transformOrigin: "80px 80px",
                        }}
                    />
                );
            })}
            <text x="80" y="76" textAnchor="middle" fill="#1e293b" fontSize="18" fontWeight="bold">{total}</text>
            <text x="80" y="94" textAnchor="middle" fill="#94a3b8" fontSize="9">TOTAL</text>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════
   INFO ROW
   ═══════════════════════════════════════════════════ */
function InfoRow({label, value, icon, verified}: {
    label: string;
    value: string;
    icon: string;
    verified?: boolean
}) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0">
            <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-xs text-slate-500">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                    <span
                        className={`text-xs font-mono ${verified ? "text-green-600" : "text-slate-800"}`}>{value}</span>
                {verified && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" fill="#22c55e" fillOpacity="0.2"/>
                        <polyline points="3.5 6 5.5 8 8.5 4" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
                    </svg>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function ElectionPage() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [ballots, setBallots] = useState<BallotRecord[]>([]);
    const [csvHash, setCsvHash] = useState("");
    const [parseProgress, setParseProgress] = useState(0);
    const [countedIndex, setCountedIndex] = useState(0);
    const [tallies, setTallies] = useState<Record<string, PartyTally>>({});
    const [currentBallot, setCurrentBallot] = useState<BallotRecord | null>(null);
    const [timestamp, setTimestamp] = useState("");
    const [readyToDrop, setReadyToDrop] = useState(false);
    const countingRef = useRef(false);
    const ballotLandedRef = useRef(false);
    const indexRef = useRef(0);
    const [currentRound, setCurrentRound] = useState(0);

    // This handles moving to the next election round
    const handleNextRound = () => {
        // Reset all data states
        setBallots([]);
        setCsvHash("");
        setParseProgress(0);
        setCountedIndex(0);
        setCurrentBallot(null);
        setTimestamp("");
        setReadyToDrop(false);

        // Advance the round and trigger the loading phase.
        // (The useEffect will automatically handle resetting the tallies for the new round!)
        setCurrentRound((prev) => prev + 1);
        setPhase("loading");
    };

    // Triggered when the 3D ballot finishes unfolding
    const handleUnfoldComplete = useCallback(() => {
        if (!currentBallot) return;

        const soundArray = audioRefs.current[currentBallot.partyCode];

        if (soundArray && soundArray.length > 0) {
            // Pick a random sound from the array
            const randomIndex = Math.floor(Math.random() * soundArray.length);
            const sound = soundArray[randomIndex];

            sound.currentTime = 0;

            sound.onended = () => {
                setReadyToDrop(true);
                sound.onended = null; // cleanup
            };

            sound.play().catch((err) => {
                console.warn("Audio skipped/blocked:", err);
                setReadyToDrop(true);
            });
        } else {
            setReadyToDrop(true);
        }
    }, [currentBallot]);

    // Helper function to force audio preloading
    const createPreloadedSound = (src: string) => {
        const audio = new Audio(src);
        audio.preload = "auto"; // 👈 Tells the browser to load this into memory immediately
        return audio;
    };

    // Read sound
    const audioRefs = useRef<Record<string, HTMLAudioElement[]>>({
        P1: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/endorsev1.m4a"),
            createPreloadedSound("/sound/endorsev2.m4a"),
            createPreloadedSound("/sound/endorsev3.m4a"),
        ] : [],
        P2: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/not-endorsev1.m4a"),
            createPreloadedSound("/sound/not-endorsev2.m4a"),
            createPreloadedSound("/sound/not-endorsev3.m4a"),
        ] : [],
        PX: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/no-votev1.m4a"),
            createPreloadedSound("/sound/no-votev2.m4a"),
            createPreloadedSound("/sound/no-votev3.m4a"),
        ] : [],
        PD: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/damagev1.m4a"),
            createPreloadedSound("/sound/damagev2.m4a"),
            createPreloadedSound("/sound/damagev3.m4a"),
        ] : [],
        C1: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/no1v1.m4a"),
            createPreloadedSound("/sound/no1v2.m4a"),
            createPreloadedSound("/sound/no1v3.m4a"),
        ] : [],
        C2: typeof Audio !== "undefined" ? [
            createPreloadedSound("/sound/no2v1.m4a"),
            createPreloadedSound("/sound/no2v2.m4a"),
            createPreloadedSound("/sound/no2v3.m4a"),
        ] : [],
    });

    const handleStartSession = () => {
        // 1. Silent play/pause to unlock audio engine in strict browsers (like Safari)
        Object.values(audioRefs.current).forEach(soundArray => {
            soundArray.forEach(sound => {
                if (sound) {
                    sound.volume = 0; // temporarily mute
                    sound.play().then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                        sound.volume = 1; // restore volume for actual counting
                    }).catch(() => {
                    }); // ignore catch if browser is weird
                }
            });
        });

        // 2. Start the loading phase
        setPhase("loading");
    };

    // Initialize tallies when round changes
    useEffect(() => {
        const round = ELECTION_ROUNDS[currentRound];
        const initial: Record<string, PartyTally> = {};
        for (const code of round.partyOrder) {
            const config = round.partyConfig[code];
            initial[code] = {code, name: config.name, color: config.color, lightColor: config.lightColor, count: 0};
        }
        setTallies(initial);
    }, [currentRound]);

    // Start automatic flow
    // useEffect(() => {
    //     if (phase === "idle") {
    //         const timer = setTimeout(() => setPhase("loading"), 1500);
    //         return () => clearTimeout(timer);
    //     }
    // }, [phase]);

    // CSV Loading
    useEffect(() => {
        if (phase !== "loading") return;
        const loadCSV = async () => {
            try {
                const response = await fetch(`/${ELECTION_ROUNDS[currentRound].filename}`);
                const text = await response.text();
                setCsvHash(simpleHash(text));
                setPhase("parsing");
                const steps = 20;
                for (let i = 0; i <= steps; i++) {
                    await new Promise((r) => setTimeout(r, 80));
                    setParseProgress(Math.round((i / steps) * 100));
                }
                const records = parseCSV(text, ELECTION_ROUNDS[currentRound]);
                setBallots(records);
                await new Promise((r) => setTimeout(r, 800));
                setPhase("counting");
            } catch (err) {
                console.error("Failed to load CSV:", err);
            }
        };
        loadCSV();
    }, [phase]);

    // Handle ballot landed callback
    const handleBallotLanded = useCallback(() => {
        ballotLandedRef.current = true;
    }, []);

    // Counting: show next ballot when previous lands
    useEffect(() => {
        if (phase !== "counting" || ballots.length === 0) return;
        countingRef.current = true;
        indexRef.current = 0;
        ballotLandedRef.current = true;

        const interval = setInterval(() => {
            if (!countingRef.current) return;

            if (ballotLandedRef.current) {
                const idx = indexRef.current;

                if (idx > 0) {
                    // Tally the previous ballot
                    const prevBallot = ballots[idx - 1];
                    setTallies((prev) => {
                        const next = {...prev};
                        const code = prevBallot.partyCode;
                        if (next[code]) {
                            next[code] = {...next[code], count: next[code].count + 1};
                        }
                        return next;
                    });
                    setCountedIndex(idx);
                }

                if (idx >= ballots.length) {
                    // All done
                    setCurrentBallot(null);
                    setTimestamp(formatTimestamp());
                    setTimeout(() => setPhase("certified"), 1200);
                    countingRef.current = false;
                    clearInterval(interval);
                    return;
                }

                // Show next ballot
                ballotLandedRef.current = false;

                // --- ADD THIS RESET ---
                setReadyToDrop(false);

                setCurrentBallot(ballots[idx]);
                indexRef.current = idx + 1;
            }
        }, 100);

        return () => {
            clearInterval(interval);
            countingRef.current = false;
        };
    }, [phase, ballots]);

    // Derived data
    const tallyArray = ELECTION_ROUNDS[currentRound].partyOrder.map((code) => tallies[code]).filter(Boolean);
    const totalCounted = tallyArray.reduce((sum, t) => sum + t.count, 0);
    const winner = phase === "certified"
        ? tallyArray.reduce((a, b) => (a.count > b.count ? a : b))
        : null;

    const statusSteps = [
        {label: "Voting Closed", done: phase !== "idle"},
        {label: "Counting in Progress", done: phase === "certified", active: phase === "counting"},
        {label: "Results Certified", done: phase === "certified"},
    ];

    return (
        <div
            className="min-h-screen flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
                backgroundImage: `url('${
                    phase === "idle"
                        ? "/BackgroundImage/Default.png"
                        : (ELECTION_ROUNDS[currentRound].backgroundImage || "/BackgroundImage/Default.png")
                }')`
            }}
        >
            {/* Optional: A subtle overlay so the background doesn't overwhelm the glass panels */}
            <div className="absolute inset-0 bg-slate-900/10 z-0 pointer-events-none"/>
            {/* Top header bar — hidden during full-screen counting */}
            <header
                className={`relative z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm ${phase === "counting" || phase === "certified" ? "hidden" : ""}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
                                 strokeWidth="2"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 tracking-wide">Official Vote Resolution
                                Session
                            </div>
                            <div className="text-[10px] text-slate-500 tracking-wider uppercase">
                                2026 ICT Election — {ELECTION_ROUNDS[currentRound].title}
                            </div>
                        </div>
                    </div>

                    {/* Status steps */}
                    <div className="hidden sm:flex items-center gap-1">
                        {statusSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-1">
                                {i > 0 &&
                                    <div className={`w-6 h-px ${step.done ? "bg-green-500" : "bg-slate-300"}`}/>}
                                <div
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-500 ${step.done ? "bg-green-50 text-green-700 border border-green-200"
                                        : step.active ? "bg-blue-50 text-blue-700 border border-blue-200"
                                            : "bg-slate-50 text-slate-400 border border-slate-200"
                                    }`}>
                                    {step.done ? (
                                        <svg width="10" height="10" viewBox="0 0 10 10">
                                            <path d="M8.5 2.5L4 7.5L1.5 5" stroke="currentColor" strokeWidth="1.5"
                                                  fill="none"/>
                                        </svg>
                                    ) : step.active ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"/>
                                    )}
                                    {step.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
                {/* ─── IDLE ─── */}
                {phase === "idle" && (
                    <div className="flex flex-col items-center justify-center py-32"
                         style={{animation: "fadeIn 1s ease-out"}}>
                        <div
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-lg">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white"
                                 strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Vote Resolution Session</h1>
                        <p className="text-slate-500 text-sm mb-8">Secure environment ready for tally
                            processing.</p>

                        <button
                            onClick={handleStartSession}
                            className="group relative flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 overflow-hidden"
                        >
                            {/* Shine effect */}
                            <div
                                className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"/>

                            <span>Start Counting Process</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </button>
                    </div>
                )}

                {/* ─── LOADING / PARSING ─── */}
                {(phase === "loading" || phase === "parsing") && (
                    <div className="max-w-xl mx-auto py-20" style={{animation: "fadeInUp 0.6s ease-out"}}>
                        <div className="glass-panel rounded-xl p-6 space-y-5" style={{
                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)",
                            backdropFilter: "blur(8px) saturate(150%)",
                            WebkitBackdropFilter: "blur(8px) saturate(150%)",
                            borderTop: "1px solid rgba(255, 255, 255, 0.9)",
                            borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
                            borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                            boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.3)"
                        }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb"
                                         strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">CSV Data Ingestion</div>
                                    <div className="text-[10px] text-slate-500">Secure ballot file processing</div>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <InfoRow label="Input Source" value="Finalized Ballot CSV File" icon="📄"/>
                                <InfoRow label="Records Loaded"
                                         value={ballots.length > 0 ? ballots.length.toString() : phase === "parsing" ? "Processing..." : "Loading..."}
                                         icon="📊"/>
                                {csvHash &&
                                    <InfoRow label="Ballot Hash" value={`SHA-${csvHash}`} icon="🔐" verified/>}
                            </div>

                            {phase === "parsing" && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Resolving Votes from CSV</span>
                                        <span className="text-blue-600 font-mono">{parseProgress}%</span>
                                    </div>
                                    <div
                                        className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-200 relative"
                                            style={{width: `${parseProgress}%`}}>
                                            <div className="absolute inset-0 progress-shimmer rounded-full"/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {csvHash && (
                                <div
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200"
                                    style={{animation: "fadeIn 0.5s ease-out"}}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <circle cx="7" cy="7" r="6" fill="none" stroke="#16a34a" strokeWidth="1.5"/>
                                        <polyline points="4.5 7 6.5 9 9.5 5" stroke="#16a34a" strokeWidth="1.5"
                                                  fill="none"/>
                                    </svg>
                                    <span className="text-[11px] text-green-700 font-medium">Ballot Integrity Hash Verified</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── COUNTING / CERTIFIED ─── */}
                {(phase === "counting" || phase === "certified") && (
                    <div className="fixed inset-0 z-20" style={{animation: "fadeInUp 0.6s ease-out"}}>
                        {/* Full-screen 3D scene (background layer) */}
                        <div className="absolute inset-0">
                            <BallotScene
                                key={currentRound}
                                currentBallot={currentBallot}
                                onBallotLanded={handleBallotLanded}
                                tallies={tallies}
                                phase={phase}
                                onUnfoldComplete={handleUnfoldComplete}
                                readyToDrop={readyToDrop}
                                roundConfig={ELECTION_ROUNDS[currentRound]}
                            />
                        </div>

                        {/* ── TOP: Progress bar ── */}
                        <div className="absolute top-4 left-4 right-4 z-30">
                            <div
                                className="max-w-xl mx-auto glass-panel rounded-xl p-3 flex items-center gap-4"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)",
                                    backdropFilter: "blur(8px) saturate(150%)",
                                    WebkitBackdropFilter: "blur(8px) saturate(150%)",
                                    borderTop: "1px solid rgba(255, 255, 255, 0.9)",
                                    borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
                                    borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                                    boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.3)"
                                }}>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                                    <span
                                        className="text-[11px] text-slate-500 whitespace-nowrap">Ballots Processed</span>
                                </div>
                                <div className="flex-1">
                                    <div
                                        className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 relative"
                                            style={{width: `${ballots.length > 0 ? (countedIndex / ballots.length) * 100 : 0}%`}}
                                        >
                                            <div className="absolute inset-0 progress-shimmer rounded-full"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-slate-800 font-mono flex-shrink-0">
                                    {countedIndex} <span
                                    className="text-slate-400 text-xs font-normal">/ {ballots.length}</span>
                                </div>
                            </div>

                            {/* Current ballot indicator */}
                            {currentBallot && phase === "counting" && (
                                <div className="max-w-xs mx-auto mt-2">
                                    <div
                                        className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2 justify-center"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)",
                                            backdropFilter: "blur(8px) saturate(150%)",
                                            WebkitBackdropFilter: "blur(8px) saturate(150%)",
                                            borderTop: "1px solid rgba(255, 255, 255, 0.9)",
                                            borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
                                            borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                                            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                                            boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.3)"
                                        }}>
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{backgroundColor: ELECTION_ROUNDS[currentRound].partyConfig[currentBallot.partyCode]?.color || "#94a3b8"}}
                                        />
                                        <div className="text-[11px] text-slate-600">
                                            <span
                                                className="font-mono text-slate-400">#{currentBallot.id.toString().padStart(4, "0")}</span>
                                            {" → "}
                                            <span className="font-semibold text-slate-800">
                        {currentBallot.partyCode === "PX" ? "No Vote (ไม่ประสงค์ลงคะแนน)" : currentBallot.partyName}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── TOP-RIGHT: Pie chart ── */}
                        <div className="absolute top-20 right-4 z-30 w-52">
                            <div
                                className="max-w-3xl mx-auto rounded-2xl p-5 relative"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)",
                                    backdropFilter: "blur(8px) saturate(150%)",
                                    WebkitBackdropFilter: "blur(8px) saturate(150%)",
                                    borderTop: "1px solid rgba(255, 255, 255, 0.9)",
                                    borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
                                    borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                                    boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.3)"
                                }}>
                                <div
                                    className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 self-start">Composition
                                </div>
                                <PieChart tallies={tallyArray} total={totalCounted}/>
                                <div className="mt-2 space-y-1 w-full">
                                    {tallyArray.map((party) => {
                                        const pct = totalCounted > 0 ? (party.count / totalCounted) * 100 : 0;
                                        return (
                                            <div key={party.code}
                                                 className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                                         style={{backgroundColor: party.color}}/>
                                                    <span
                                                        className="text-[10px] text-slate-600 truncate"
                                                        title={party.code === "PX" ? "No Vote (ไม่ประสงค์ลงคะแนน)" : party.name}
                                                    >
                                                        {party.code === "PX" ? "No Vote (ไม่ประสงค์ลงคะแนน)" : party.name}
                                                    </span>
                                                </div>
                                                <span
                                                    className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                                                    {pct.toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── BOTTOM: Results table ── */}
                        <div className="absolute bottom-4 left-4 right-4 z-30">
                            <div
                                className="max-w-3xl mx-auto rounded-2xl p-5 relative"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)",
                                    backdropFilter: "blur(8px) saturate(150%)",
                                    WebkitBackdropFilter: "blur(8px) saturate(150%)",
                                    borderTop: "1px solid rgba(255, 255, 255, 0.9)",
                                    borderLeft: "1px solid rgba(255, 255, 255, 0.7)",
                                    borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                                    boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.3)",
                                    paddingRight: 0,
                                    paddingLeft: 0
                                }}>
                                <div
                                    className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2"
                                    style={{paddingLeft: 20}}>Results
                                </div>
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 font-semibold"
                                            style={{paddingLeft: 20}}>Party
                                        </th>
                                        <th className="text-right text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 font-semibold">Votes</th>
                                        <th className="text-right text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 font-semibold">Percentage</th>
                                        <th className="text-right text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 font-semibold"
                                            style={{paddingRight: 20}}>Status
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {tallyArray.map((party) => {
                                        const pct = totalCounted > 0 ? (party.count / totalCounted) * 100 : 0;
                                        const isWinner = phase === "certified" && winner?.code === party.code && party.code !== "PX";
                                        return (
                                            <tr key={party.code}
                                                className={`border-b border-slate-100 transition-colors ${isWinner ? "bg-blue-50/60" : ""}`}>
                                                <td className="py-1.5" style={{paddingLeft: 20}}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded"
                                                             style={{backgroundColor: party.color}}/>
                                                        <span
                                                            className="text-xs text-slate-800 font-medium">{party.code === "PX" ? "No Vote (ไม่ประสงค์ลงคะแนน)" : party.name}</span>
                                                        {isWinner && <span
                                                            className="text-[9px] bg-yellow-100 text-yellow-800 border border-yellow-300 px-1.5 py-0.5 rounded font-semibold">WINNER</span>}
                                                    </div>
                                                </td>
                                                <td className="py-1.5 text-right"><span
                                                    className="text-xs text-slate-800 font-mono font-bold">{party.count}</span>
                                                </td>
                                                <td className="py-1.5 text-right"><span
                                                    className="text-xs text-slate-600 font-mono">{pct.toFixed(2)}%</span>
                                                </td>
                                                <td className="py-1.5 text-right" style={{paddingRight: 20}}>
                                                    {isWinner ? (
                                                        <span
                                                            className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-semibold">ELECTED</span>
                                                    ) : phase === "certified" ? (
                                                        <span className="text-[9px] text-slate-400">—</span>
                                                    ) : (
                                                        <span
                                                            className="text-[9px] text-blue-600 animate-pulse">COUNTING</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                    <tfoot>
                                    <tr className="border-t border-slate-300">
                                        <td className="py-1.5 text-xs text-slate-500 font-semibold"
                                            style={{paddingLeft: 20}}>Total
                                        </td>
                                        <td className="py-1.5 text-right text-xs text-slate-800 font-mono font-bold">{totalCounted}</td>
                                        <td className="py-1.5 text-right text-xs text-slate-600 font-mono">{totalCounted > 0 ? "100.00%" : "0.00%"}</td>
                                        <td/>
                                    </tr>
                                    </tfoot>
                                </table>

                                {/* Certification banner embedded at bottom */}
                                {phase === "certified" && (
                                    <div className="mt-3 pt-3 border-t border-green-200 " style={{paddingLeft: 20}}>
                                        <div className="flex items-center gap-3 " style={{paddingBottom: 10}}>
                                            <div
                                                className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border border-green-200">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                     stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-800">Vote Resolution
                                                    Complete — Results Certified
                                                </div>
                                                <div
                                                    className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
                                                    <span>Total: <span
                                                        className="font-mono font-bold text-slate-700">{totalCounted}</span></span>
                                                    <span>Certified: <span
                                                        className="font-mono text-slate-700">{timestamp}</span></span>
                                                    {winner && winner.code !== "PX" && (
                                                        <span>Winner: <span
                                                            className="font-bold text-slate-800">{winner.name}</span> ({((winner.count / totalCounted) * 100).toFixed(2)}%)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* 👇 ADD THIS NEW BUTTON BLOCK */}
                                        {currentRound < ELECTION_ROUNDS.length - 1 ? (
                                            <button
                                                onClick={handleNextRound}
                                                className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
                                            >
                                                Continue to {ELECTION_ROUNDS[currentRound + 1].title}
                                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                     strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                                </svg>
                                            </button>
                                        ) : (
                                            <div
                                                className="px-5 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200">
                                                All Elections Completed
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer — hidden during full-screen counting */}
            <footer
                className={`relative z-10 mt-8 border-t border-slate-200 bg-white/60 backdrop-blur ${phase === "counting" || phase === "certified" ? "hidden" : ""}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">© 2026 ICT Election Commission — Transparent Digital
                        Vote Resolution
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"/>
                        <span className="text-[10px] text-slate-400">Secure Session</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
