import { Link } from "react-router-dom";
import logo from "../assets/speedrent.png";

export default function BrandLogo({ className = "" }) {
  return (
    <Link to="/" aria-label="Speedrent home">
      <img className={`logo-image ${className}`.trim()} src={logo} alt="Speedrent logo" />
    </Link>
  );
}
