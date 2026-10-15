<?php
/**
 * Plugin Name:       Montblack — Site
 * Description:       Publica o site do Motel Montblack (suítes, cardápio, experiência) como página inicial do WordPress. As fotos e os filmes ficam na pasta assets/media do plugin ou na Biblioteca de Mídia, com nomes como "mexicana-01.webp" e "mexicana-filme.mp4".
 * Version:           1.0.3
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Motel Montblack
 * Text Domain:       montblack-site
 */

defined( 'ABSPATH' ) || exit;

/*
 * A página inicial passa a ser o site (site.html + assets/ deste plugin); o tema continua
 * instalado e o painel funciona normalmente. Roda no fim do template_redirect para que o
 * modo "Em breve" do WordPress.com — e qualquer outra trava de acesso — decida antes.
 */
add_action( 'template_redirect', 'montblack_site_render', 99999 );

function montblack_site_render() {
	if ( ! ( is_front_page() || is_home() ) || is_feed() || is_preview() ) {
		return;
	}
	if ( ! montblack_site_visible() ) {
		return; // site em "Em breve" ou privado: quem não é do site vê a página normal da plataforma
	}
	$dir  = plugin_dir_path( __FILE__ );
	$base = plugin_dir_url( __FILE__ );
	$html = file_get_contents( $dir . 'site.html' );
	if ( false === $html ) {
		return;
	}

	/* "assets/…" relativos → pasta do plugin, com versão pela data do arquivo (atualização sem cache velho) */
	$html = preg_replace_callback(
		'/(href|src)="assets\/([^"?#]+)"/',
		function ( $m ) use ( $base, $dir ) {
			$file = $dir . 'assets/' . $m[2];
			$ver  = file_exists( $file ) ? '?v=' . filemtime( $file ) : '';
			return $m[1] . '="' . esc_url( $base . 'assets/' . $m[2] ) . $ver . '"';
		},
		$html
	);
	/* o data.js recebe onde estão as fotos e os filmes */
	$html = preg_replace(
		'/(<script src="[^"]*assets\/js\/data\.js[^"]*"><\/script>)/',
		'<script>window.MB_MEDIA = ' . wp_json_encode( montblack_site_media() ) . ';</script>' . "\n" . '$1',
		$html,
		1
	);

	status_header( 200 );
	header( 'Content-Type: text/html; charset=UTF-8' );
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- página própria do plugin, já pronta
	exit;
}

/**
 * A visibilidade do site manda: em "Em breve" (WordPress.com: wpcom_public_coming_soon = 1) ou
 * privado (blog_public = -1), só quem é do site (pode "read") vê o site; os demais recebem
 * a página que a própria plataforma mostra. Com o site público, todo mundo vê.
 */
function montblack_site_visible() {
	$coming_soon = (int) get_option( 'wpcom_public_coming_soon', 0 ) === 1;
	$private     = (int) get_option( 'blog_public', 1 ) === -1;
	return ! ( $coming_soon || $private ) || current_user_can( 'read' );
}

/**
 * Fotos e filmes. Com a pasta assets/media dentro do plugin, usa ela (mesma estrutura do site).
 * Sem ela, procura na Biblioteca de Mídia os arquivos de nome "<suíte>-01.webp", "<suíte>-01-sm.webp",
 * "<suíte>-filme.mp4", "<suíte>-filme.webp" e monta um mapa nome → endereço (vale mesmo que
 * tenham sido enviados em meses diferentes). O mapa fica guardado por 12 h e é refeito a cada envio.
 */
function montblack_site_media() {
	$dir = plugin_dir_path( __FILE__ );
	if ( is_dir( $dir . 'assets/media' ) ) {
		return array(
			'base' => plugin_dir_url( __FILE__ ) . 'assets/media/',
			'flat' => false,
		);
	}
	$map = get_transient( 'montblack_site_media_map' );
	if ( ! is_array( $map ) ) {
		global $wpdb;
		$files = $wpdb->get_col(
			"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND ( meta_value LIKE '%.webp' OR meta_value LIKE '%.mp4' ) ORDER BY meta_id ASC"
		);
		$up  = wp_get_upload_dir();
		$map = array();
		foreach ( $files as $file ) {
			$name = wp_basename( $file );
			if ( preg_match( '/^[a-z0-9-]+-(\d{2}(-sm)?|filme)\.(webp|mp4)$/', $name ) && ! isset( $map[ $name ] ) ) {
				$map[ $name ] = $up['baseurl'] . '/' . $file;
			}
		}
		set_transient( 'montblack_site_media_map', $map, 12 * HOUR_IN_SECONDS );
	}
	$up = wp_get_upload_dir();
	return array(
		'base' => trailingslashit( $up['baseurl'] ),
		'flat' => true,
		'map'  => (object) $map,
	);
}

/* mídia nova ou apagada: refaz o mapa no próximo acesso */
add_action( 'add_attachment', 'montblack_site_forget_media' );
add_action( 'delete_attachment', 'montblack_site_forget_media' );
function montblack_site_forget_media() {
	delete_transient( 'montblack_site_media_map' );
}
