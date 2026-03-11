"use client";

import React from "react";
import { CHEF_SERVICE_INFO } from "../../lib/api";

interface PrintHeaderProps {
    title: string;
    unitName?: string;
    showDate?: boolean;
    invertLogos?: boolean;
}

const PrintHeader: React.FC<PrintHeaderProps> = ({ title, unitName, showDate = true, invertLogos = false }) => {
    // When inverted, we use #4A3732 (dark brown) for the logo and text
    // The background will be #FFF5EE (seashell/warm white)
    const headerClasses = invertLogos
        ? "mb-4 pb-2 border-b-[1.5px] border-[#4A3732] font-sans bg-[#FFF5EE] text-[#4A3732]"
        : "mb-4 pb-2 border-b-[1.5px] border-white/20 print:border-black font-sans bg-transparent print:bg-white text-white print:text-black";

    const textClasses = invertLogos
        ? "text-[#4A3732]"
        : "text-white print:text-black";

    // Logo blocks
    const leftLogoSrc = invertLogos ? "/justice_symbol.svg" : "/logo_converted.svg";
    const rightLogoSrc = invertLogos ? "/logo_converted.svg" : "/justice_symbol.svg";

    const LogoImage = ({ src, alt }: { src: string, alt: string }) => {
        if (invertLogos) {
            // Using WebKit mask to perfectly colorize the SVG to #4A3732 without relying on SVG internal fill
            return (
                <div
                    className="w-full h-20 bg-[#4A3732]"
                    style={{
                        WebkitMaskImage: `url(${src})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url(${src})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                    }}
                    role="img"
                    aria-label={alt}
                />
            );
        }
        return (
            <img
                src={src}
                alt={alt}
                className="w-full h-20 object-contain print:object-contain"
                style={{ objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        );
    };

    return (
        <div className={headerClasses}>
            <div className="flex justify-between items-center mb-0">
                {/* Left Logo */}
                <div className="w-[15%] shrink-0">
                    <LogoImage src={leftLogoSrc} alt="Logo Gauche" />
                </div>

                {/* Central Labels */}
                <div className="flex-1 text-center px-4 leading-tight">
                    <h1 className={`text-[10pt] font-bold leading-tight m-0 ${textClasses}`}>المركز الاستشفائي الجامعي - تلمسان<br />CENTRE HOSPITALIER UNIVERSITAIRE - TLEMCEN</h1>
                    <h2 className={`text-[10pt] font-bold leading-tight mt-1 mb-0 ${textClasses}`}>مصلحة الطب الشرعي و قانون الطب والأخلاقيات<br />SERVICE DE MEDECINE LEGALE, DROIT MEDICAL ET ETHIQUE</h2>

                    {unitName && (
                        <p className={`text-[11pt] font-black mt-1 mb-0 ${textClasses}`}>
                            {unitName.toUpperCase()}
                        </p>
                    )}
                </div>

                {/* Right Logo */}
                <div className="w-[15%] shrink-0 flex justify-end">
                    <LogoImage src={rightLogoSrc} alt="Logo Droit" />
                </div>
            </div>

            {showDate && (
                <div className="flex justify-end mb-2 mt-2">
                    <div className={`flex items-baseline gap-2 text-[11pt] ${textClasses}`}>
                        <span>Tlemcen, le</span>
                        <input type="text" className={`w-40 font-bold bg-transparent border-none p-0 focus:outline-none ${textClasses}`} defaultValue={new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                    </div>
                </div>
            )}

            <div className="text-center mb-2 mt-2">
                <h2 className={`text-[12pt] font-bold uppercase underline underline-offset-4 m-0 ${textClasses}`}>{title}</h2>
            </div>
        </div>
    );
};

export default PrintHeader;
