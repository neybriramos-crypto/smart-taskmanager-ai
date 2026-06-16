'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
    { href: '/',              icon: '▦', label: 'Dashboard'     },
    { href: '/equipo',        icon: '◈', label: 'Equipo'        },
    { href: '/analisis',      icon: '⌘', label: 'Análisis IA'   },
    { href: '/configuracion', icon: '◎', label: 'Configuración' },
];

export default function Sidebar({ usuario, progreso = 0, total = 0, completadas = 0, mostrarNotificacion }) {
    const pathname = usePathname();
    const router   = useRouter();

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (mostrarNotificacion) {
            mostrarNotificacion('Sesión cerrada correctamente', 'success');
        }
        
        router.push('/login');
    };

    return (
        <aside style={s.aside}>
            <div style={s.logo}>
                <div style={s.logoBadge}>✦</div>
                <span style={s.logoText}>Smart Tasks <span style={{ color:'var(--accent)' }}>AI</span></span>
            </div>
            <nav style={{ flex:1 }}>
                {NAV.map(({ href, icon, label }) => {
                    const activo = pathname === href;
                    return (
                        <Link key={href} href={href} style={{ textDecoration:'none' }}>
                            <div style={{ ...s.navItem, ...(activo ? s.navActivo : {}) }}>
                                <span style={s.navIcon}>{icon}</span>{label}
                            </div>
                        </Link>
                    );
                })}
            </nav>
            <div style={s.progresoBox}>
                <div style={s.progresoLabel}>Progreso semanal</div>
                <div style={s.progresoNum}>{progreso}%</div>
                <div style={s.progresoBar}>
                    <div style={{ ...s.progresoFill, width:`${progreso}%` }}/>
                </div>
                <div style={s.progresoSub}>{completadas} de {total} tareas</div>
            </div>
            <div style={s.usuarioRow}>
                <div style={s.avatar}>{usuario?.nombre?.[0]?.toUpperCase() || 'U'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={s.usuarioNombre}>{usuario?.nombre || 'Usuario'}</div>
                    <div style={s.usuarioEmail}>{usuario?.email || ''}</div>
                </div>
                <button onClick={cerrarSesion} title="Cerrar sesión" style={s.logoutBtn}>⏻</button>
            </div>
        </aside>
    );
}

const s = {
    aside:        { position:'fixed', top:0, left:0, width:220, height:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'20px 12px', zIndex:100, gap:4 },
    logo:         { display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingLeft:4 },
    logoBadge:    { width:30, height:30, borderRadius:7, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff' },
    logoText:     { fontSize:14, fontWeight:700, color:'var(--text)' },
    navItem:      { display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, marginBottom:2, cursor:'pointer', color:'var(--muted)', fontSize:13 },
    navActivo:    { background:'var(--accent-dim)', color:'var(--accent)', fontWeight:600 },
    navIcon:      { fontSize:14, width:18, textAlign:'center' },
    progresoBox:  { background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)', padding:'14px 12px', marginTop:8 },
    progresoLabel:{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 },
    progresoNum:  { fontSize:22, fontWeight:700, color:'var(--text)', marginBottom:6 },
    progresoBar:  { height:4, background:'var(--border)', borderRadius:2 },
    progresoFill: { height:'100%', background:'var(--accent)', borderRadius:2, transition:'width 0.4s' },
    progresoSub:  { fontSize:10, color:'var(--muted)', marginTop:5 },
    usuarioRow:   { display:'flex', alignItems:'center', gap:8, marginTop:12, padding:'10px 8px', borderTop:'1px solid var(--border)' },
    avatar:       { width:30, height:30, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 },
    usuarioNombre:{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    usuarioEmail: { fontSize:10, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    logoutBtn:    { background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16, padding:4, flexShrink:0 },
};