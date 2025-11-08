const { execSync } = require("child_process");
const fs = require("fs");

console.log("🔍 Running pre-commit checks...");

try {
  // Get the list of staged files
  const stagedFiles = execSync("git diff --cached --name-only", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter((file) => file.length > 0);

  if (stagedFiles.length === 0) {
    console.log("✅ No files to check.");
    process.exit(0);
  }

  console.log(`Checking ${stagedFiles.length} file(s)...`);

  // Patterns to search for secrets
  const secretPatterns = [
    /api[_-]?key/i,
    /api[_-]?secret/i,
    /password\s*=/i,
    /bearer\s+[a-z0-9\-._~+/]+=*/i,
    /private[_-]?key/i,
    /aws[_-]?access/i,
  ];

  let foundSecrets = false;

  // Check each staged file
  for (const file of stagedFiles) {
    // Skip files that don't exist (deleted files)
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      secretPatterns.forEach((pattern) => {
        if (pattern.test(line)) {
          console.error(`⚠️  Potential secret in ${file}:${index + 1}`);
          console.error(`   ${line.trim()}`);
          foundSecrets = true;
        }
      });
    });
  }

  if (foundSecrets) {
    console.error("\n❌ Commit rejected: Potential secrets detected!");
    console.error("Please remove sensitive data before committing.\n");
    process.exit(1); // Non-zero exit code blocks the commit
  }

  process.exit(0); // Zero exit code allows the commit
} catch (error) {
  console.error("❌ Error running pre-commit hook:", error.message);
  process.exit(1);
}
