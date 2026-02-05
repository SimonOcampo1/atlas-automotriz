"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Shape, ExtrudeGeometry } from "three";
import type { Group } from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { translate, type Locale } from "@/lib/i18n";

type BoxProps = {
    position: [number, number, number];
    rotation: [number, number, number];
};

const Box = ({ position, rotation }: BoxProps) => {
    const geometry = useMemo(() => {
        const shape = new Shape();
        const angleStep = Math.PI * 0.5;
        const radius = 1;

        shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1);
        shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2);
        shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3);
        shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4);

        const extrudeSettings = {
            depth: 0.3,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 10,
            curveSegments: 10,
        };

        const created = new ExtrudeGeometry(shape, extrudeSettings);
        created.center();
        return created;
    }, []);

    const material = useMemo(
        () => (
            <meshPhysicalMaterial
                color="#cfd2d9"
                metalness={1}
                roughness={0.3}
                reflectivity={0.6}
                ior={1.5}
                emissive="#0b0d10"
                emissiveIntensity={0.1}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.1}
                clearcoatRoughness={0.2}
                sheen={0}
                sheenRoughness={1.0}
                sheenColor="#ffffff"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
                side={0}
                alphaTest={0}
                depthWrite={true}
                depthTest={true}
            />
        ),
        []
    );

    return (
        <mesh geometry={geometry} position={position} rotation={rotation}>
            {material}
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<Group | null>(null);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.12;
        }
    });

    const { viewport } = useThree();
    const spacing = 0.75;

    const boxes = useMemo(() => {
        const targetWidth = viewport.width * 1.6;
        const count = Math.ceil(targetWidth / spacing) + 4;
        return Array.from({ length: count }, (_, index) => ({
            position: [(index - count / 2) * spacing, 0, 0] as [number, number, number],
            rotation: [(index - 10) * 0.1, Math.PI / 2, 0] as [number, number, number],
            id: index,
        }));
    }, [viewport.width]);

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box key={box.id} position={box.position} rotation={box.rotation} />
            ))}
        </group>
    );
};

type SceneProps = {
    onReady?: () => void;
};

export const Scene = ({ onReady }: SceneProps) => {
    const cameraPosition: [number, number, number] = [5, 5, 20];

    return (
        <div className="h-full w-full">
            <Canvas
                camera={{ position: cameraPosition, fov: 40 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                onCreated={() => {
                    if (onReady) {
                        requestAnimationFrame(() => requestAnimationFrame(onReady));
                    }
                }}
            >
                <ambientLight intensity={10} />
                <directionalLight position={[10, 10, 5]} intensity={12} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};

type HeroSectionProps = {
    logosCount: number;
    locale: Locale;
};

export const HeroSection = ({ logosCount, locale }: HeroSectionProps) => {
    const [canvasVisible, setCanvasVisible] = useState(false);

    const handleExploreClick = () => {
        const section = document.getElementById("explorar");
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-background text-foreground">
            <div
                className="absolute inset-0 transition-opacity duration-900 ease-out will-change-opacity"
                style={{ opacity: canvasVisible ? 0.7 : 0 }}
            >
                <Scene onReady={() => setCanvasVisible(true)} />
            </div>
            <div className="absolute inset-0 bg-background/60" />
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 text-left sm:py-20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">
                        {translate(locale, "hero.byAuthor")}
                    </p>
                    <div className="flex items-center gap-3">
                        <Badge className="border border-border/60 bg-background/80 px-3 py-1 text-sm text-foreground hover:bg-foreground/10">
                            {translate(locale, "counts.brands", { count: logosCount })}
                        </Badge>
                        <LanguageToggle locale={locale} />
                        <div className="hidden sm:flex">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
                    {translate(locale, "hero.title")}
                </h1>
                <p className="max-w-2xl text-base text-foreground/70 sm:text-lg">
                    {translate(locale, "hero.subtitle")}
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={handleExploreClick}>
                        {translate(locale, "hero.exploreCollection")}
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="border-border/60 text-foreground hover:bg-foreground/10 hover:text-foreground"
                    >
                        <a href="/learn">{translate(locale, "hero.learnByLevels")}</a>
                    </Button>
                </div>
                <div className="sm:hidden">
                    <ThemeToggle />
                </div>
            </div>
        </section>
    );
};
