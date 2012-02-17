package org.sakaiproject.nakamura.swissarmybundle;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import javax.servlet.ServletException;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.felix.scr.annotations.Reference;
import org.mozilla.javascript.*;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.http.HttpContext;
import org.osgi.service.http.HttpService;

@SlingServlet(methods = "GET", paths = "/system/swissrender", generateComponent=true)
public class SwissRendererServlet extends SlingSafeMethodsServlet {

    BundleContext bundleContext;
    ComponentContext componentContext;

    @Reference
    HttpService httpService;
    
    @Reference
    HttpContext httpContext;
    
    public void activate(ComponentContext context)
    {
        componentContext = context;
        bundleContext = componentContext.getBundleContext();
    }
    
    private void registerExtraPaths() {
        // Todo This was supposed to fetch the urlpatterns from javascript scope we create and register them
        // with sling (see swissrender.js for more notes), but I couldn't figure out how to cleanly 
        // register them.
    }
    
	@Override
    protected void doGet(SlingHttpServletRequest request,
                         SlingHttpServletResponse response)
        throws ServletException, IOException
    {
        Context cx = Context.enter();
        Scriptable scope = cx.initStandardObjects();
        
        // Bring in trimpath. This should be changed to use the standard trimpath we have in /dev
        URL trimpathLib = bundleContext.getBundle().getResource("trimpath.template.js");
        cx.evaluateReader(scope, new InputStreamReader(trimpathLib.openStream()), "trimpath.template.js", 1, null);
        
        InputStream swissrender = request.getResourceResolver().getResource("/dev/rhino/swissrender.js").adaptTo(java.io.InputStream.class);
        cx.evaluateReader(scope, new InputStreamReader(swissrender), "swissrender.js", 1, null);
        Function f = (Function) scope.get("swissBootstrap", scope);
        Object fresult = f.call(cx, scope, scope, new Object[] {request,response,bundleContext});
        cx.exit();
    }
}
