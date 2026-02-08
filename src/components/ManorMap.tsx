import { useMemo, useState } from 'react';
import { ProceduralRoom, ManorLayout, getRoomColors } from '../utils/procedural';
import { MapPin, Eye, EyeOff } from 'lucide-react';

interface ManorMapProps {
    layout: ManorLayout;
    currentRoomId: string;
    onRoomClick?: (roomId: string) => void;
    showSecretPassages?: boolean;
}

export function ManorMap({
    layout,
    currentRoomId,
    onRoomClick,
    showSecretPassages = false
}: ManorMapProps) {
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

    // Calculate SVG viewBox based on room positions
    const viewBox = useMemo(() => {
        if (layout.rooms.length === 0) return '0 0 500 400';

        const xs = layout.rooms.map(r => r.position.x);
        const ys = layout.rooms.map(r => r.position.y);
        const minX = Math.min(...xs) - 100;
        const minY = Math.min(...ys) - 80;
        const maxX = Math.max(...xs) + 100;
        const maxY = Math.max(...ys) + 80;

        return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
    }, [layout.rooms]);

    const getRoomById = (id: string) => layout.rooms.find(r => r.id === id);

    // Generate connection lines
    const connections = useMemo(() => {
        const lines: Array<{ from: ProceduralRoom; to: ProceduralRoom; isSecret: boolean }> = [];
        const processed = new Set<string>();

        layout.rooms.forEach(room => {
            room.connections.forEach(connId => {
                const key = [room.id, connId].sort().join('-');
                if (!processed.has(key)) {
                    const toRoom = getRoomById(connId);
                    if (toRoom) {
                        lines.push({ from: room, to: toRoom, isSecret: false });
                        processed.add(key);
                    }
                }
            });
        });

        // Add secret passages
        if (showSecretPassages) {
            layout.secretPassages.forEach(({ from, to }) => {
                const fromRoom = getRoomById(from);
                const toRoom = getRoomById(to);
                if (fromRoom && toRoom) {
                    lines.push({ from: fromRoom, to: toRoom, isSecret: true });
                }
            });
        }

        return lines;
    }, [layout, showSecretPassages]);

    const currentRoom = getRoomById(currentRoomId);

    return (
        <div className="manor-map-container">
            <svg
                viewBox={viewBox}
                className="manor-map-svg"
                style={{ width: '100%', height: '100%' }}
            >
                <defs>
                    {/* Glow filter for current room */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Fog filter for undiscovered rooms */}
                    <filter id="fog">
                        <feGaussianBlur stdDeviation="2" />
                        <feColorMatrix type="matrix" values="0.3 0 0 0 0  0 0.3 0 0 0  0 0 0.3 0 0  0 0 0 0.5 0" />
                    </filter>

                    {/* Secret passage pattern */}
                    <pattern id="secretPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                        <circle cx="4" cy="4" r="1" fill="#6366f1" opacity="0.5" />
                    </pattern>
                </defs>

                {/* Connection lines */}
                <g className="connections">
                    {connections.map(({ from, to, isSecret }, i) => (
                        <line
                            key={`conn-${i}`}
                            x1={from.position.x}
                            y1={from.position.y}
                            x2={to.position.x}
                            y2={to.position.y}
                            className={`connection-line ${isSecret ? 'secret' : ''}`}
                            stroke={isSecret ? 'url(#secretPattern)' : '#334155'}
                            strokeWidth={isSecret ? 3 : 2}
                            strokeDasharray={isSecret ? '8 4' : 'none'}
                            opacity={from.discovered && to.discovered ? 1 : 0.3}
                        />
                    ))}
                </g>

                {/* Rooms */}
                <g className="rooms">
                    {layout.rooms.map(room => {
                        const colors = getRoomColors(room.mood);
                        const isCurrent = room.id === currentRoomId;
                        const isHovered = room.id === hoveredRoom;
                        const isClickable = room.discovered && onRoomClick && currentRoom?.connections.includes(room.id);

                        return (
                            <g
                                key={room.id}
                                className={`room-group ${isCurrent ? 'current' : ''} ${isClickable ? 'clickable' : ''}`}
                                transform={`translate(${room.position.x}, ${room.position.y})`}
                                onClick={() => isClickable && onRoomClick?.(room.id)}
                                onMouseEnter={() => setHoveredRoom(room.id)}
                                onMouseLeave={() => setHoveredRoom(null)}
                                style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                filter={room.discovered ? undefined : 'url(#fog)'}
                            >
                                {/* Room background */}
                                <rect
                                    x={-50}
                                    y={-30}
                                    width={100}
                                    height={60}
                                    rx={8}
                                    fill={room.discovered ? colors.accent : '#1e293b'}
                                    stroke={isCurrent ? '#dc2626' : (isHovered && room.discovered) ? '#64748b' : '#334155'}
                                    strokeWidth={isCurrent ? 3 : 2}
                                    filter={isCurrent ? 'url(#glow)' : undefined}
                                    className="room-rect"
                                />

                                {/* Room name */}
                                <text
                                    y={-5}
                                    textAnchor="middle"
                                    className="room-name"
                                    fill={room.discovered ? colors.text : '#64748b'}
                                    fontSize="10"
                                    fontFamily="var(--font-display)"
                                >
                                    {room.discovered ? room.name : '???'}
                                </text>

                                {/* Room status icons */}
                                <g transform="translate(0, 15)">
                                    {isCurrent && (
                                        <circle r="5" fill="#dc2626" className="player-indicator">
                                            <animate
                                                attributeName="r"
                                                values="4;6;4"
                                                dur="1.5s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    )}
                                    {!room.discovered && (
                                        <g transform="translate(-6, -6)">
                                            <EyeOff size={12} color="#64748b" />
                                        </g>
                                    )}
                                    {room.searched && room.discovered && (
                                        <g transform="translate(-6, -6)">
                                            <Eye size={12} color="#22c55e" />
                                        </g>
                                    )}
                                </g>
                            </g>
                        );
                    })}
                </g>

                {/* Player position marker (floating above current room) */}
                {currentRoom && (
                    <g
                        className="player-marker"
                        transform={`translate(${currentRoom.position.x}, ${currentRoom.position.y - 45})`}
                    >
                        <MapPin size={24} color="#dc2626" fill="#dc2626" />
                        <animateTransform
                            attributeName="transform"
                            type="translate"
                            values={`${currentRoom.position.x} ${currentRoom.position.y - 45}; ${currentRoom.position.x} ${currentRoom.position.y - 50}; ${currentRoom.position.x} ${currentRoom.position.y - 45}`}
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </g>
                )}
            </svg>

            {/* Room info tooltip */}
            {hoveredRoom && (
                <div className="room-tooltip">
                    {(() => {
                        const room = getRoomById(hoveredRoom);
                        if (!room || !room.discovered) return <span>Undiscovered</span>;

                        const colors = getRoomColors(room.mood);
                        return (
                            <>
                                <h4 style={{ color: colors.text }}>{room.name}</h4>
                                <p>{room.description}</p>
                                <div className="room-features">
                                    {room.features.map((f, i) => (
                                        <span key={i} className="feature-tag">{f}</span>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
