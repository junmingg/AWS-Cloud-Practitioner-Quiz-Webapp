import type { Section } from '$lib/types/index.js';

// Map of section filenames to human-readable titles
const SECTION_TITLES: Record<string, string> = {
	'account_management_billing_support.md': 'Account Management, Billing & Support',
	'advanced_identity.md': 'Advanced Identity',
	'architecting_and_ecosystem.md': 'Architecting & Ecosystem',
	'cloud_computing.md': 'Cloud Computing',
	'cloud_integration.md': 'Cloud Integration',
	'cloud_monitoring.md': 'Cloud Monitoring',
	'databases.md': 'Databases',
	'deploying.md': 'Deploying',
	'ec2.md': 'EC2 - Elastic Compute Cloud',
	'ec2_storage.md': 'EC2 Storage',
	'elb_asg.md': 'ELB & Auto Scaling Groups',
	'global_infrastructure.md': 'Global Infrastructure',
	'iam.md': 'Identity & Access Management',
	'machine_learning.md': 'Machine Learning',
	'other_aws_services.md': 'Other AWS Services',
	'other_compute.md': 'Other Compute Services',
	's3.md': 'S3 - Simple Storage Service',
	'security_compliance.md': 'Security & Compliance',
	'vpc.md': 'VPC - Virtual Private Cloud'
};

function parseMarkdown(content: string): string {
	// Split content into lines for better processing
	const lines = content.split('\n');
	let html = '';
	let inTable = false;
	let inCodeBlock = false;
	let inList = false;
	let listType = '';
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		// Handle code blocks
		if (line.startsWith('```')) {
			if (!inCodeBlock) {
				inCodeBlock = true;
				const language = line.substring(3).trim();
				html += `<div class="code-block"><pre><code class="language-${language}">`;
			} else {
				inCodeBlock = false;
				html += '</code></pre></div>';
			}
			continue;
		}
		
		if (inCodeBlock) {
			html += line + '\n';
			continue;
		}
		
		// Handle headers
		if (line.startsWith('####')) {
			html += `<h4 class="section-h4">${line.substring(4).trim()}</h4>`;
		} else if (line.startsWith('###')) {
			html += `<h3 class="section-h3">${line.substring(3).trim()}</h3>`;
		} else if (line.startsWith('##')) {
			html += `<h2 class="section-h2">${line.substring(2).trim()}</h2>`;
		} else if (line.startsWith('#')) {
			html += `<h1 class="section-h1">${line.substring(1).trim()}</h1>`;
		}
		// Handle tables
		else if (line.includes('|') && line.trim() !== '') {
			if (!inTable) {
				inTable = true;
				html += '<div class="table-container"><table class="content-table">';
				
				// Check if next line is header separator
				if (i + 1 < lines.length && lines[i + 1].includes('---')) {
					const cells = line.split('|').filter(cell => cell.trim() !== '');
					html += '<thead><tr>';
					cells.forEach(cell => {
						html += `<th>${formatInlineMarkdown(cell.trim())}</th>`;
					});
					html += '</tr></thead><tbody>';
					i++; // Skip the separator line
				} else {
					html += '<tbody>';
				}
			} else {
				const cells = line.split('|').filter(cell => cell.trim() !== '');
				html += '<tr>';
				cells.forEach(cell => {
					html += `<td>${formatInlineMarkdown(cell.trim())}</td>`;
				});
				html += '</tr>';
			}
		}
		// Handle lists
		else if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
			const isOrdered = line.match(/^\s*\d+\.\s+/);
			const currentListType = isOrdered ? 'ol' : 'ul';
			
			if (!inList) {
				inList = true;
				listType = currentListType;
				html += `<${listType} class="content-list">`;
			} else if (listType !== currentListType) {
				html += `</${listType}><${currentListType} class="content-list">`;
				listType = currentListType;
			}
			
			const content = line.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, '');
			html += `<li>${formatInlineMarkdown(content)}</li>`;
		}
		// Handle empty lines and close lists/tables
		else if (line.trim() === '') {
			if (inTable) {
				html += '</tbody></table></div>';
				inTable = false;
			}
			if (inList) {
				html += `</${listType}>`;
				inList = false;
			}
			html += '<br>';
		}
		// Handle regular paragraphs
		else if (line.trim() !== '') {
			if (inTable) {
				html += '</tbody></table></div>';
				inTable = false;
			}
			if (inList) {
				html += `</${listType}>`;
				inList = false;
			}
			
			// Check for blockquotes
			if (line.startsWith('>')) {
				html += `<blockquote class="content-blockquote">${formatInlineMarkdown(line.substring(1).trim())}</blockquote>`;
			} else {
				html += `<p class="content-paragraph">${formatInlineMarkdown(line)}</p>`;
			}
		}
	}
	
	// Close any remaining open tags
	if (inTable) {
		html += '</tbody></table></div>';
	}
	if (inList) {
		html += `</${listType}>`;
	}
	if (inCodeBlock) {
		html += '</code></pre></div>';
	}
	
	return html;
}

function formatInlineMarkdown(text: string): string {
	return text
		// Bold and italic
		.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		// Inline code
		.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
		// Links
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="content-link" target="_blank" rel="noopener noreferrer">$1</a>');
}

function extractTitle(content: string, filename: string): string {
	// Try to get title from SECTION_TITLES mapping first
	if (SECTION_TITLES[filename]) {
		return SECTION_TITLES[filename];
	}

	// Fallback: extract from first heading in content
	const titleMatch = content.match(/^#\s+(.+)$/m);
	if (titleMatch) {
		return titleMatch[1];
	}

	// Last fallback: format filename
	return filename
		.replace('.md', '')
		.replace(/_/g, ' ')
		.replace(/\b\w/g, l => l.toUpperCase());
}

function countWords(text: string): number {
	return text.split(/\s+/).filter(word => word.length > 0).length;
}

export async function loadSections(): Promise<Section[]> {
	const sections: Section[] = [];
	const baseUrl = '/sections';
	
	// List of all section filenames
	const filenames = Object.keys(SECTION_TITLES);
	
	try {
		const fetchPromises = filenames.map(async (filename) => {
			try {
				const response = await fetch(`${baseUrl}/${filename}`);
				if (!response.ok) {
					throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
				}
				
				const content = await response.text();
				const title = extractTitle(content, filename);
				const parsedContent = parseMarkdown(content);
				const wordCount = countWords(content);
				
				return {
					id: filename.replace('.md', ''),
					title,
					filename,
					content: parsedContent,
					wordCount,
					lastModified: new Date()
				} as Section;
			} catch (error) {
				console.error(`Error loading section ${filename}:`, error);
				return null;
			}
		});
		
		const results = await Promise.all(fetchPromises);
		
		// Filter out null results and add to sections array
		results.forEach(section => {
			if (section) {
				sections.push(section);
			}
		});
		
		// Sort sections by title for consistent ordering
		sections.sort((a, b) => a.title.localeCompare(b.title));
		
		return sections;
	} catch (error) {
		console.error('Error loading sections:', error);
		throw new Error('Failed to load revision sections');
	}
}

export async function loadSection(id: string): Promise<Section | null> {
	const baseUrl = '/sections';
	const filename = `${id}.md`;
	
	try {
		const response = await fetch(`${baseUrl}/${filename}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch section: ${response.statusText}`);
		}
		
		const content = await response.text();
		const title = extractTitle(content, filename);
		const parsedContent = parseMarkdown(content);
		const wordCount = countWords(content);
		
		return {
			id,
			title,
			filename,
			content: parsedContent,
			wordCount,
			lastModified: new Date()
		};
	} catch (error) {
		console.error(`Error loading section ${id}:`, error);
		return null;
	}
}