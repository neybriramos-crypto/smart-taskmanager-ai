import './globals.css';

export const metadata = {
    title:       'Smart Task Manager AI',
    description: 'Administrador de tareas colaborativo con inteligencia artificial',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}