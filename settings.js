export function loadSettings() {
    const settingsIcon = document.querySelector('a[href="#"]:nth-child(5)'); // Icon Gear
    
    settingsIcon.addEventListener('click', () => {
        const theme = confirm("Bạn có muốn chuyển sang giao diện Sáng không? (Bấm Cancel để giữ Dark Mode)");
        if (theme) {
            document.documentElement.style.setProperty('--bg-dark', '#ffffff');
            document.documentElement.style.setProperty('--text-main', '#313338');
            document.documentElement.style.setProperty('--sidebar-bg', '#f2f3f5');
        } else {
            location.reload(); // Reset về dark mode mặc định
        }
    });
}