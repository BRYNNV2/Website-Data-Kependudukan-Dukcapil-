import React from "react"
import "./three-body-loader.css"

interface ThreeBodyLoaderProps {
    className?: string
    size?: number
    speed?: number
    color?: string
}

export function ThreeBodyLoader({ className, size = 35, speed = 0.8, color = "#5D3FD3" }: ThreeBodyLoaderProps) {
    return (
        <div
            className={`three-body ${className || ''}`}
            style={{
                '--uib-size': `${size}px`,
                '--uib-speed': `${speed}s`,
                '--uib-color': color
            } as React.CSSProperties}
        >
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
        </div>
    )
}
