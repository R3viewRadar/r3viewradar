interface CategoryPillsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export default function CategoryPills({ categories, selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="category-pills">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`pill ${selected === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
