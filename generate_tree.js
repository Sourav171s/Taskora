const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

function generateTree(dirPath, prefix = '') {
    let result = '';
    let files;
    try {
        files = fs.readdirSync(dirPath);
    } catch (e) {
        return result;
    }

    // Filter out ignored directories
    files = files.filter(f => {
        const fullPath = path.join(dirPath, f);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && IGNORE_DIRS.includes(f)) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    });

    // Sort: directories first, then files
    files.sort((a, b) => {
        const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    files.forEach((file, index) => {
        const isLast = index === files.length - 1;
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        result += prefix + (isLast ? '└── ' : '├── ') + file + '\n';
        
        if (stat.isDirectory()) {
            result += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });
    
    return result;
}

const rootDir = process.argv[2] || process.cwd();
const tree = path.basename(rootDir) + '\n' + generateTree(rootDir);
fs.writeFileSync(path.join(rootDir, 'project_structure.txt'), tree);
console.log('Tree successfully written to project_structure.txt');
