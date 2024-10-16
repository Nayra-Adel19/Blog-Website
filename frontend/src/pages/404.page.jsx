import duckNotFound from '../imgs/sad-duck.gif';
import fullLogo from '../imgs/duckFullLogo.png';
import { Link } from "react-router-dom";


const PageNotFound = () => {
	return (
		<section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">

			<img src={duckNotFound} className="select-none w-72 aspect-square object-contain border-2 border-opacity-5 rounded border-grey" />

			<h1 className="text-4xl font-gelasio leading-7">Page not found</h1>
			<p className="text-dark-grey text-xl leading-7 -mt-8">The page you are looking for dose not exists. Head back to the <Link to="/" className="text-black underline">home page</Link></p>

			<div className="mt-auto">
				<img src={fullLogo} className="h-10 object-contain block mx-auto select-none" />
				<h4 className="text-xl font-gelasio leading-7">Quack Your Way to Success!</h4>
				<p className="mt-5 text-dark-grey">Dive into Code with Ducks and explore millions of stories worldwide</p>
			</div>

		</section>
	)
}

export default PageNotFound;